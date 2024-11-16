module.exports = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "pass123",
    DB: "car_management",
    dialect: "mysql",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }

};