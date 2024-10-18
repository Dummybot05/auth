import express from 'express';
import bcrypt from 'bcrypt';
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { v4 as uuidv4 } from 'uuid';
config();

const sql = neon(process.env.DATABASE_URL);
const app = express();
app.use(express.json());

app.get('/', async (req, res) => {
  res.send("Hello, world!");
});

app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await sql`SELECT * FROM auth WHERE username = ${username} OR email = ${email}`;
    console.log(userExists);
    if (!(userExists.length === 0)) {
      return res.send('Username or email already exists');
    }
    try {
      const hashPassword = await bcrypt.hash(password, 10);
      const newUser = {
        uuid: uuidv4(),
        username,
        email,
        password: hashPassword
      };
      try {
        const result = await sql`INSERT INTO auth(uuid, username, email, password) VALUES (${newUser.uuid}, ${newUser.username}, ${newUser.email}, ${newUser.password})`;
        if (result) {
          return res.send("Insert Successfull");
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
});

app.post('/api/signin', async (req, res) => {
  const { username, email, password } = req.body;
  const userExists = await sql`SELECT password FROM auth WHERE username = ${username} AND email = ${email}`;
  
  try {
    const decryptPassword = await bcrypt.compare(password, userExists[0].password);
    if (decryptPassword) {
      return res.send("Login Successfull");
    }
  } catch (error) {
    console.log(error)
  }
});

const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
