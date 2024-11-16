
const { Sequelize, DataTypes } = require('sequelize');

    const Car = Sequelize.define("car", {
        id:{
            type: Sequelize.LONG 
        },
        name: {
            type: Sequelize.STRING
        },
        model: Sequelize.STRING
    });

    export default Car