const mysql = require('mysql2');

function createConnection() {
  const connection = mysql.createConnection({
    host: 'gasunion-database-do-user-14562319-0.b.db.ondigitalocean.com',
    user: 'doadmin',
    password: 'AVNS_EpXeOpmQDAMrNDn3jnL',
    database: 'gasunion',
    port: 25060
    
  });

  connection.connect((error) => {
    if (error) {
      console.error('Error de conexión a la base de datos:', error);
    } else {
      console.log('Conexión exitosa a la base de datos');
    }
  });

  return connection;
}

module.exports = createConnection;
