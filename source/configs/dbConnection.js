import mongoose from "mongoose";
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}
export const connectDB = async () => {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = await mongoose
      .connect(process.env.MONGO_URI, {
        bufferCommands: false,
      })
      .then(() => console.log("DB connected"));
  }
  cached.conn = await cached.promise;
  return cached.conn;
};
