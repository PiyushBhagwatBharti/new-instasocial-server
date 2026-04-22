import { app } from "./source/app.js";
// import { config } from "dotenv";


// config();
// import 'dotenv/config';

const port = 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
