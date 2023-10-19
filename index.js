const TelegramApi = require("node-telegram-bot-api");
const token = require("./config");
const fs = require("fs").promises;
const path = require("path");

const bot = new TelegramApi(token.token, {polling: true});

const adminId = 421428702;
// const teacherId = 421428702;
const teacherId = 956225646;
const usersBase = [];

const shopping = {
  question_1: "1. How old are you?",
  question_2: "2. How often do you usually go shopping?",
  question_3: "3. Who usually does the shopping in your family?",
  question_4: "4. What can you buy in your nearest shopping centre?",
  question_5: "5. Why do you think some people hate shopping?",
  question_6:
    "6. What would you advise a person who hates shopping but needs to buy something?",
};

const saveUserFile = async () => {
  if (isSavingUserFile) {
    console.log("Файл пользователя уже записывается");
    return;
  }

  isSavingUserFile = true;
  const userJson = JSON.stringify(user, null, 2);

  try {
    await new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(__dirname, `users/${user.id}.json`),
        userJson,
        "utf-8",
        error => {
          if (error) {
            console.log("Ошибка записи файла");
            reject(error);
          } else {
            console.log("Файл пользователя записан");
            resolve();
          }
        }
      );
    });
  } catch (error) {
    console.error("Произошла ошибка:", error);
  } finally {
    isSavingUserFile = false;
  }
};

async function askQuestion(user, question) {
  await bot.sendMessage(user.id, question);

  let isAudioExpected = false;
  let alreadySentOnlyVoiceMessage = false;

  return new Promise(resolve => {
    bot.on("message", msg => {
      if (msg.voice) {
        isAudioExpected = false;
        resolve(msg);
      } else {
        if (!alreadySentOnlyVoiceMessage) {
          alreadySentOnlyVoiceMessage = true;
          bot.sendMessage(user.id, "Only voice messages!!!");
        }
        isAudioExpected = true;
      }
    });
  });
}

async function askQuestions(user, questions) {
  const answers = [];

  for (const key in questions) {
    if (questions.hasOwnProperty(key)) {
      const question = questions[key];
      const answer = await askQuestion(user, question);
      answers.push(answer);
    }
  }

  return answers;
}

const start = () => {
  bot.setMyCommands([
    {command: "/start", description: "Hi!"},
    {command: "/user_info", description: "Info about user"},
    {command: "/shopping", description: "shopping"},
    {command: "/save_user", description: "save user"},
    {command: "/test", description: "save user"},
  ]);

  bot.on("message", async msg => {
    try {
      const {
        from: {id, first_name, last_name},
      } = msg;

      const text = msg.text;

      const user = {
        id,
        first_name: first_name || "Unknown",
        last_name: last_name || "Unknown",
      };

      const existingUser = usersBase.find(el => el.id === user.id);

      if (existingUser === undefined) {
        usersBase.push(user);
      }
      // switch (text) {
      //     case 'test':
      //         bot.sendMessage(user.id, 'Test');
      //         break;

      //     default:
      //         bot.sendMessage(user.id, 'HZ');
      //         break;
      // }
      if (text === "/start") {
        return [
          bot.sendSticker(
            user.id,
            "https://tlgrm.ru/_/stickers/a0a/6b0/a0a6b09c-7f38-37e5-9dac-583343142b54/1.webp"
          ),
          bot.sendMessage(
            user.id,
            `Hello ${user.first_name}!\nВыберите тему "/shopping" в нижнем левом углу.\nБудьте готовы записать ответы на вопросы по теме голосовым сообщением.\nИспользуйте слова и выражения которые мы изучали!\nGood luck! =)`
          ),
        ];
      }

      if (text === "/user_info") {
        return bot.sendMessage(
          user.id,
          `You are ${user.first_name} ${user.last_name}`
        );
      }

      if (text === "/shopping") {
        askQuestions(user, shopping)
          .then(answers => {
            bot.sendMessage(
              teacherId,
              `Ответы от ${user.first_name} ${user.last_name}:`
            );
            answers.forEach(voiceMsg =>
              bot.sendAudio(teacherId, `${voiceMsg.voice.file_id}`)
            );
            bot.sendMessage(user.id, "Thank you for your answers!");
          })
          .catch(error => {
            console.error("Error:", error);
          })
          .finally(() => {
            bot.off("message");
          });
      }

      if (text === "/all_users") {
        console.log("Вот все ваши пользователи:", usersBase);
      }

      if (text === "/save_user") {
        const userJson = JSON.stringify(user, null, 2);
        fs.writeFile(path.join(__dirname, `users/${user.id}.txt`), userJson);
      }
      // return [
      //     bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/a0a/6b0/a0a6b09c-7f38-37e5-9dac-583343142b54/192/22.webp'),
      //     bot.sendMessage(chatId, `I don't understand you`),
      // ];
    } catch (error) {
      console.log("Error:", error);
    }
  });
};

start();
