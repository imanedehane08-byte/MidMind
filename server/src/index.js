// Starts the backend server after loading environment variables and seed data.
import "dotenv/config";
import "./models/store.js";
import app from "./app.js";

const port = Number(process.env.PORT) || 5050;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
