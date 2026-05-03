import "dotenv/config";
import "./data/store.js"; // seed admin account on first boot
import app from "./app.js";

const port = Number(process.env.PORT) || 5050;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});