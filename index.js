const express = require('express');
const bodyParser = require('body-parser');
const dbConfig = require("./config/db.config.js");
const { hash, compare } = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');

const upload = multer({ storage: storage });
const path = require('path');
const fs = require('fs');
const { Sequelize, Model, DataTypes, where } = require('sequelize');
const app = express();
const PORT = 3000;
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
//app.use(errorHandler)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${uniqueSuffix}-${file.originalname}`;
    cb(null, fileName);
  }
});


const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});


class Car extends Model { }
class User extends Model { }

User.init({
  email: DataTypes.STRING,
  password: DataTypes.STRING
},
  { sequelize, modelName: 'User' },
);


Car.init({
  name: DataTypes.STRING,
  type: DataTypes.STRING

},
  { sequelize, modelName: 'Car' },
);



app.post('/register', async (req, res) => {
  try {
    let { email, password } = req.body
    await sequelize.sync();
    let user = await User.create(req.body)
    res.status(201).json({ id: user.id, email: user.email })
  } catch (error) {
    console.log(error.message)
  }
})

app.post('/login', async (req, res, next) => {
  try {
    let { email, password } = req.body
    if (!email) throw { name: "Email is required" }
    if (!password) throw { name: "Password is required" }
    let user = await User.findOne({
      where: {
        email
      }
    })
    if (!user) throw { name: "Invalid email/password" }
    let valid = compare(password, user.password)
    if (!valid) throw { name: "Invalid email/password" }
    let access_token = jwt.sign({ id: user.id }, "secret")
    res.status(200).json({ access_token })
  } catch (error) {
    next(error)
  }
})





app.post('/car', authentication, (req, res) => {
  (async () => {
    await sequelize.sync();
    await Car.create(req.body).then(data => {
      res.send(data);
    });
  })();

});

app.get('/car', (req, res) => {
  (async () => {
    await sequelize.sync();
    res.send(await Car.findAll());
  })();

});

app.get('/car/search', authentication, (req, res) => {
  (async () => {
    await sequelize.sync();
    res.send(await Car.findAll({ where: { name: req.query.name } }));
  })();

});
app.put('/car', authentication, (req, res) => {
  (async () => {
    await sequelize.sync();
    await Car.update(req.body, { where: { id: req.body.id } }).then(data => {
      res.send(data);
    });
  })();
});

app.delete('/car', authentication, (req, res) => {
  const carId = req.query.id;
  (async () => {
    await sequelize.sync();
    const result = await Car.destroy({ where: { id: carId } })

    if (result === 1) {
      res.status(200).send({ message: 'Car deleted successfully' });
    } else {
      res.status(404).send({ message: 'Car not found' });
    }

  })();

});


function errorHandler(err, req, res, next) {
  let status = err.status || 500
  let message = err.message || "Internal server error"

  switch (err.name) {
    case "SequelizeValidationError":
    case "SequelizeUniqueConstraintError":
      status = 400;
      message = err.errors[0].message
      break;
    case "Invalid Input":
    case "Email is required":
    case "Password is required":
      status = 400;
      message = err.name
      break;
    case "Invalid email/password":
      status = 401;
      message = err.name
      break
    case "Invalid token":
    case "JsonWebTokenError":
      status = 401;
      message = "Invalid token"
      break
    case "Forbidden":
      status = 403;
      message = "You are not authorized"
      break;
    case "Data not found":
    case "Hero not found":
      status = 404;
      message = err.name
      break;
  }
  res.status(status).json({ message })
}

async function authentication(req, res, next) {
  try {
    if (!req.headers.authorization) throw { name: "Invalid token" }
    let [type, token] = req.headers.authorization.split(" ")
    if (type !== "Bearer") throw { name: "Invalid token" }
    let payload = jwt.verify(token, "secret")
    if (!payload) throw { name: "Invalid token" }
    let user = await User.findByPk(payload.id)
    if (!user) throw { name: "Invalid token" }
    req.user = {
      id: user.id
    }
    next()
  } catch (error) {
    next(error)
  }
}



app.listen(PORT, (error) => {
  if (!error)
    console.log("Server is Successfully Running,and App is listening on port " + PORT)
  else
    console.log("Error occurred, server can't start", error);
}
);