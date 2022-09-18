const express = require("express");
const app = express();
const port = 3001 || process.env.port;

var io = require("socket.io")(port);

let chel = 0;

const mysql = require("mysql2");

const pool = mysql.createPool({
  //host: 'nikolayhs.beget.tech',
  //user: 'nikolayhs_bot',
  //database: 'nikolayhs_bot',
  //password:'Nikolayhs_bot',
  host: "localhost", 
  user: "root",
  database: "nikolayhs_bot",
  password: "ahtiger2",
});

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

io.on("connection", function (socket) {
  socket.on("check_views", function (result) {
    bot.telegram
      .sendMessage(id_kolya, "Заявка номер " + result[0])
      .catch((e) => {
        console.log(e);
      });
    if (result[1]) {
      bot.telegram.sendPhoto(id_kolya, result[1]);
      bot.telegram.sendPhoto(id_vlad, result[1]);
      bot.telegram.sendPhoto(id_roma, result[1]);
      // bot.telegram.sendPhoto(id_andrey,result[1])
    }

    bot.telegram.sendMessage(id_vlad, "Заявка номер " + result[0]);
    bot.telegram.sendMessage(id_roma, "Заявка номер " + result[0]);
    //bot.telegram.sendMessage(id_andrey,'Заявка номер '+result[0])
    //bot.telegram.sendPhoto(id_vlad,result[1])
  });

  socket.on("check_views_vlad", function (result) {
    bot.telegram.sendMessage(id_vlad, "Заявка номер " + result[0]);
    bot.telegram.sendPhoto(id_vlad, result[1]);
  });

  socket.on("processed", function (result) {
    bot.telegram.sendMessage(
      result[1],
      "Заявка номер " + result[0] + " обработана"
    );
  });

  socket.on("error", function (result) {
    bot.telegram.sendMessage(
      result[1],
      "Заявка номер " +
        result[0] +
        " не обработана(ошибка в заявке), напиши админу"
    );
  });
});

app.post("/check_views", (req, res) => {
  bot.telegram.sendMessage(id_kolya, "Заявка номер " + req.body.id);
  bot.telegram.sendPhoto(id_kolya, req.body.file_id);
});

app.post("/processed", (req, res) => {
  bot.telegram.sendMessage(
    req.body.id_user,
    "Заявка номер " + req.body.id + " обработана"
  );
  console.log("nen z");
});
app.post("/error", (req, res) => {
  bot.telegram.sendMessage(
    req.body.id_user,
    "Заявка номер " +
      req.body.id +
      " не обработана(ошибка в заявке), напиши админу"
  );
});

const {
  Telegraf,
  session,
  Scenes: { BaseScene, Stage },
  Markup,
} = require("telegraf");

const bot_token = "1922976147:AAFyOZ6r_BMdBSpfADzL9bTdJxBWupkNW4s"; // получаем токен бота

const id_vlad = "846809274";
const id_kolya = "841304292";
const id_roma = "1065423969";
//const id_andrey='1737594249'

const remove_keyboard = Markup.removeKeyboard();
const menu_keyboard = Markup.keyboard([
  "💸Оставить заявку на оплату",
  "💻Оставить заявку на изменение/добавление MAC-адресов",
  "👀Проверить статус заявки",
  "⚠Сообщить о проблеме",
  "📋Инструкции",
  "🚨Пнуть админа,чтобы обработал заявку🤬",
]).oneTime(); // общее меню бота

const menu_instructions = Markup.keyboard([
  "💳Узнать номер карты",
  "⬅️Назад",
]).oneTime();

const menu_otmena = Markup.keyboard(["🚫Отмена"]).oneTime();

// Сцена, для заявки на оплату -------- ( номер комнаты)
const PaymentScene_1 = new BaseScene("PaymentScene_1");
PaymentScene_1.enter((ctx) =>
  ctx.reply("Напиши номер комнаты", remove_keyboard)
);
PaymentScene_1.on("text", (ctx) => {
  ctx.session.number_room = ctx.message.text;
  return ctx.scene.enter("PaymentScene_2"); // Переходи в сцену PaymentScene_2
});
// ------------------

// Сцена, для заявки на оплату -------- ( Фамилилия на которую зареган инет )
const PaymentScene_2 = new BaseScene("PaymentScene_2");
PaymentScene_2.enter((ctx) =>
  ctx.reply("Напиши фамилию на которую зарегестрировал сеть")
);
PaymentScene_2.on("text", (ctx) => {
  ctx.session.fio = ctx.message.text;
  return ctx.scene.enter("PaymentScene_3"); // Переходи в сцену PaymentScene_3
});
// ------------------

// Сцена, для заявки на оплату -------- ( Скрин оплаты инет )
const PaymentScene_3 = new BaseScene("PaymentScene_3");
PaymentScene_3.enter((ctx) => ctx.reply("Отправь скрин платежа"));
PaymentScene_3.on("photo", (ctx) => {
  console.log(ctx.message);
  ctx.session.foto = ctx.message.photo[0].file_id;
  ctx.reply(`Заявка принята`, menu_keyboard);
  return ctx.scene.leave();
});
PaymentScene_3.leave((ctx) => {
  if (ctx.message.text != "/start") {
    const data = [
      ctx.from.id,
      "Оплата",
      ctx.session.number_room,
      ctx.session.fio,
      ctx.session.foto,
    ]; // Формируем структуру данных для записи в БД
    const sql =
      "INSERT INTO applications(id_user,type,  room_number,fio_user,file_id,date,time) VALUES(?,?,?,?,?,Now(),Now())";
    pool.query(sql, data, function (err, results) {
      if (err) console.log(err);
      else {
        console.log(results.insertId);
        ctx.reply(`Номер вашей заявки : ${results.insertId}`);
        bot.telegram.sendMessage(
          id_kolya,
          `Поступила заявка №(${results.insertId}) на оплату от (${ctx.session.fio}) комната (${ctx.session.number_room})`
        );
        bot.telegram.sendMessage(
          id_vlad,
          `Поступила заявка №(${results.insertId}) на оплату от (${ctx.session.fio}) комната (${ctx.session.number_room})`
        );
        bot.telegram.sendMessage(
          id_roma,
          `Поступила заявка №(${results.insertId}) на оплату от (${ctx.session.fio}) комната (${ctx.session.number_room})`
        );
        //bot.telegram.sendMessage(id_andrey,`Поступила заявка №(${results.insertId}) на оплату от (${ctx.session.fio}) комната (${ctx.session.number_room})`)
      }
    });
  } else {
    ctx.reply(`Не удалось создать заявку, повторите попыткуу!`);
  }
});
// ------------------

// Сцена, для добавление/изменения списка устройств -------- ( номер комнаты)
const Add_change_mac_1 = new BaseScene("Add_change_mac_1");
Add_change_mac_1.enter((ctx) =>
  ctx.reply("Напиши номер комнаты", remove_keyboard)
);
Add_change_mac_1.on("text", (ctx) => {
  ctx.session.number_room = ctx.message.text;
  return ctx.scene.enter("Add_change_mac_2"); // Переходи в сцену Add_change_mac_2
});
// ------------------

// Сцена, для добавление/изменения списка устройств -------- (Спрашиваем фамилию на которую зарегестрирована сеть)
const Add_change_mac_2 = new BaseScene("Add_change_mac_2");
Add_change_mac_2.enter((ctx) =>
  ctx.reply("Напиши фамилию на которую зарегестрировал сеть.", remove_keyboard)
);
Add_change_mac_2.on("text", (ctx) => {
  ctx.session.fio = ctx.message.text;
  return ctx.scene.enter("Add_change_mac_3"); // Переходи в сцену Add_change_mac_3
});
// ------------------

// Сцена, для добавление/изменения списка устройств -------- (Спрашиваем сколько устройств всего должно быть подключено)
const Add_change_mac_3 = new BaseScene("Add_change_mac_3");
Add_change_mac_3.enter((ctx) =>
  ctx.reply(
    "Напиши Mac-адреса, всех устройств(через пробел), которые должны быть подключены.",
    remove_keyboard
  )
);
Add_change_mac_3.on("text", (ctx) => {
  if (ctx.message.text === "/start") {
    ctx.reply(`Попробуй еще раз отправить МАК адреса`);
  } else {
    ctx.session.mac = ctx.message.text;
    ctx.reply(`Заявка принята`, menu_keyboard);
    return ctx.scene.leave();
  }
});

Add_change_mac_3.leave((ctx) => {
  const data = [
    ctx.from.id,
    "MAC",
    ctx.session.number_room,
    ctx.session.fio,
    ctx.session.mac,
  ]; // Формируем структуру данных для записи в БД
  const sql =
    "INSERT INTO applications(id_user,type,  room_number,fio_user,comment,date,time) VALUES(?,?,?,?,?,Now(),Now())";
  pool.query(sql, data, function (err, results) {
    if (err) console.log(err);
    else {
      console.log(results.insertId);
      ctx.reply(`Номер вашей заявки : ${results.insertId}`);
      bot.telegram.sendMessage(
        id_kolya,
        `Поступила заявка №(${results.insertId}) на добавление/удаление MAC-ов от  (${ctx.session.fio}) комната (${ctx.session.number_room})`
      );
      bot.telegram.sendMessage(
        id_vlad,
        `Поступила заявка №(${results.insertId}) на добавление/удаление MAC-ов от (${ctx.session.fio}) комната (${ctx.session.number_room})`
      );
      bot.telegram.sendMessage(
        id_roma,
        `Поступила заявка №(${results.insertId}) на добавление/удаление MAC-ов от (${ctx.session.fio}) комната (${ctx.session.number_room})`
      );
      //bot.telegram.sendMessage(id_andrey,`Поступила заявка №(${results.insertId}) на добавление/удаление MAC-ов от (${ctx.session.fio}) комната (${ctx.session.number_room})`)
    }
  });
});
// ------------------

// Сцена, для проверки статуса заявки -------- ( номер заявки )
const Check_status_1 = new BaseScene("Check_status_1");
Check_status_1.enter((ctx) =>
  ctx.reply("Напиши номер заявки", remove_keyboard)
);
Check_status_1.on("text", (ctx) => {
  ctx.session.number_app = Number(ctx.message.text);
  ctx.reply(`Проверяю...`, menu_keyboard);
  return ctx.scene.leave();
});
Check_status_1.leave((ctx) => {
  const data = [ctx.session.number_app, ctx.from.id];
  const sql = "SELECT type,status FROM applications WHERE id=? AND id_user=?";
  pool.query(sql, data, function (err, results) {
    if (err) {
      console.log(err);
      ctx.reply("Ты забыл что такое цифры ? ERROR!", menu_keyboard);
    } else {
      if (results.length == 0) {
        ctx.reply(
          "Такой заявки нет,либо не вы создавали ее ( только автор заявки может посмотреть ее статус )",
          menu_keyboard
        );
      } else {
        ctx.reply(
          `Тип заявки: ${results[0].type}\nСтатус заявки: ${results[0].status}`,
          menu_keyboard
        );
      }
    }
  });
});
// ------------------

// Сцена, Пнуть админа -------- ( Пинаем )
const Kick_1 = new BaseScene("Kick_1");
Kick_1.enter((ctx) => {
  ctx.reply(`🦿Пнул тебя!🤬`, menu_keyboard);
  console.log(ctx.from.id);
  return ctx.scene.leave();
});
Kick_1.leave((ctx) => {
  bot.telegram.sendMessage(
    id_kolya,
    `Пинает тебя,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`
  );
  bot.telegram.sendMessage(
    id_vlad,
    `Пинает тебя,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`
  );
  bot.telegram.sendMessage(
    id_roma,
    `Пинает тебя,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`
  );
  //bot.telegram.sendMessage(id_andrey,`Пинает тебя,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`)
});
// ------------------

// Сцена, Инструкция -------- (  )
const Instructions_1 = new BaseScene("Instructions_1");
Instructions_1.enter((ctx) => {
  ctx.reply(`Список инструкций`, menu_instructions);
  return ctx.scene.leave();
});
Instructions_1.leave((ctx) => {
  //bot.telegram.sendMessage(id_kolya,`Обработай заявку,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`)
  //bot.telegram.sendMessage(id_vlad,`Обработай заявку,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`)
});
// ------------------

// Сцена, старта
const Start_1 = new BaseScene("Start_1");
Start_1.enter((ctx) => {
  ctx.reply(
    "Привет, меня зовут Мартин.\nЯ бот сети II AMPERA\nТеперь я знаю о тебе и буду помогать тебе взаимодействовать с админами.",
    menu_keyboard
  );
  //console.log(ctx.from.id);
  ctx.telegram.sendPhoto(
    ctx.from.id,
    "AgACAgIAAxkBAAIDqWFDWvI_gj7mdkv8N7ewCIex_jLgAAIZtjEbSKYZSj26dNRDnU9WAQADAgADeAADIAQ"
  );

  // Проверка есть ли в базе такой пользоатель ----------
  let check = "false";
  const sql1 = "SELECT chat_id from users";
  let mes;
  pool.query(sql1, function (err, rows) {
    for (i = 0; i < rows.length; i++) {
      if (rows[i].chat_id == ctx.from.id) {
        check = "true;";
        //buf_id=rows[i].id;
        //console.log('This &{} already exists in BD')
        break;
      }
    }

    //Если пользователя нет, то добавляем в базу -------------
    if (check === "false") {
      const users = [
        ctx.from.id,
        ctx.from.first_name,
        ctx.from.last_name,
        ctx.from.username,
        1,
      ];
      const sql2 =
        "INSERT INTO users(chat_id,first_name,last_name,username,status) VALUES(?,?, ?,?,?)";
      pool.query(sql2, users, function (err, results) {
        if (err) console.log(err);
        else {
          chel = chel + 1;
          console.log(`${chel} Новый пользователь ${ctx.from.username}`);

          //mes="Поздравляем! Вы подписались на Бот\n\nИспользуйте /off чтобы приостановить подписку.";
          // bott.sendMessage(chatId,"Поздравляем! Вы подписались на Бот\n\nИспользуйте /off чтобы приостановить подписку.")
        }
      });
    }
    // -----------------------------------

    // Случай, если пользователь в базе есть, но когда то отписался
    else {
      const data = [1, ctx.from.id];
      pool.query("UPDATE users SET status=? where chat_id=?", data, () => {});

      //console.log("Status updated at start");
      //mes="Ваша подписка активирована\n\nВы всегда можете отключить ее  с помощью команды /off.";
      //bott.sendMessage(chatId,"Ваша подписка активирована\n\nВы всегда можете отключить ее  с помощью команды /off.")
    }
    // ----------------------
  });
  // ------------------------------------

  return ctx.scene.leave();
});
// ------------------

// Сцена, проблемы -------- (  )
const Problem_1 = new BaseScene("Problem_1");
Problem_1.enter((ctx) => {
  ctx.reply(`В разработке..`, menu_keyboard);
  return ctx.scene.leave();
});
Problem_1.leave((ctx) => {
  //bot.telegram.sendMessage(id_kolya,`Обработай заявку,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`)
  //bot.telegram.sendMessage(id_vlad,`Обработай заявку,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`)
});
// ------------------

// Сцена, админы -------- (  )
const Admin_1 = new BaseScene("Admin_1");
Admin_1.enter((ctx) => {
  if (
    (ctx.from.id != id_kolya) &
    (ctx.from.id != id_vlad) &
    (ctx.from.id != id_roma)
  ) {
    ctx.reply("Ты не мой хозяин!");
    return ctx.scene.leave();
  } else {
    ctx.reply("Текст для рассылки:");
    Admin_1.on("text", (ctx) => {
      const sql2 = "SELECT * FROM users";
      pool.query(sql2, function (err, results) {
        if (err) {
          console.log(err);
        } else {
          for (i = 0; i < results.length; i++) {
            if (
              ctx.from.id == id_kolya ||
              ctx.from.id == id_vlad ||
              ctx.from.id == id_roma
            ) {
              bot.telegram
                .sendMessage(results[i].chat_id, ctx.message.text)
                .catch((e) => {
                  console.log(e);
                });
              console.log(results[i].id);
            } else {
              console.log("тут чужак");
            }
          }
          ctx.reply("Рассылка завершена!", menu_keyboard);
          return ctx.scene.leave();
        }
      });
    });
  }
});
Admin_1.leave((ctx) => {
  //bot.telegram.sendMessage(id_kolya,`Обработай заявку,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`)
  //bot.telegram.sendMessage(id_vlad,`Обработай заявку,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`)
});
// ------------------

// Сцена, просмотра  заявок (  )
const Check_1 = new BaseScene("Check_1");
Check_1.enter((ctx) => {
  if (
    ctx.from.id == id_kolya ||
    ctx.from.id == id_vlad ||
    ctx.from.id == id_roma
  ) {
    ctx.reply("Напиши номер заявки");
    Check_1.on("text", (ctx) => {
      ctx.session.number_app = Number(ctx.message.text);
      return ctx.scene.enter("Check_2"); // Переходи в сцену Check_2
    });
  } else {
    ctx.leave("Ты не мой хозяин!");
    return ctx.leave();
  }
});
// ------------------

/*
// Сцена, просмотра  заявок (  )
const Check_2=new BaseScene('Check_2')
Check_2.enter(ctx=>{
    if (ctx.from.id==id_kolya || ctx.from.id==id_vlad ){
    ctx.reply('Напиши номер заявки');
    Check_2.on('text',ctx=>{
        ctx.session.number_app=Number(ctx.message.text)
        return ctx.scene.enter('Check_2') // Переходи в сцену Check_3
    })
}
    
    else {
        ctx.leave('Ты не мой хозяин!')
        return ctx.leave()
    }
})
// ------------------
*/
//Check_2.leave(ctx=>{
//bot.telegram.sendMessage(id_kolya,`Обработай заявку,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`)
//bot.telegram.sendMessage(id_vlad,`Обработай заявку,\n(@${ctx.from.username})\n(${ctx.from.first_name})\n(${ctx.from.last_name})\n(${ctx.from.id})\n пинает тебя`)
//})
// ------------------

const stage = new Stage([
  PaymentScene_1,
  PaymentScene_2,
  PaymentScene_3,
  Add_change_mac_1,
  Add_change_mac_2,
  Add_change_mac_3,
  Check_status_1,
  Kick_1,
  Instructions_1,
  Start_1,
  Problem_1,
  Admin_1,
  Check_1,
]);
const bot = new Telegraf("1922976147:AAFyOZ6r_BMdBSpfADzL9bTdJxBWupkNW4s"); // подключаемся к боту
bot.use(session());
bot.use(stage.middleware());
bot.command("/start", (ctx) => ctx.scene.enter("Start_1"));
bot.command("/push", (ctx) => ctx.scene.enter("Admin_1"));
//bot.command('/name',ctx=>ctx.scene.enter('PaymentScene'))

bot.hears("💸Оставить заявку на оплату", (ctx) =>
  ctx.scene.enter("PaymentScene_1")
);
bot.hears("💻Оставить заявку на изменение/добавление MAC-адресов", (ctx) =>
  ctx.scene.enter("Add_change_mac_1")
);
bot.hears("👀Проверить статус заявки", (ctx) =>
  ctx.scene.enter("Check_status_1")
);
//bot.hears('🚨Пнуть проайдера,чтобы лучше работал', ctx=>ctx.scene.enter('Kick_1'))
bot.hears("🚨Пнуть админа,чтобы обработал заявку🤬", (ctx) =>
  ctx.scene.enter("Kick_1")
);

bot.hears("📋Инструкции", (ctx) => ctx.scene.enter("Instructions_1"));
bot.hears("⚠Сообщить о проблеме", (ctx) => ctx.scene.enter("Problem_1"));

bot.hears(
  "💳Узнать номер карты",
  (ctx) => ctx.reply("2202 2026 2349 5888 Николай П"),
  menu_instructions
);
bot.hears("⬅️Назад", (ctx) => ctx.reply(`Главное меню`, menu_keyboard));

bot.command("/check", (ctx) => ctx.scene.enter("Check_1"));

bot.catch((err) => {
  console.log(err);
});

bot.launch();
