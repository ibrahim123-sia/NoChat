import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );
    await mongoose.connect(`mongodb://localhost:27017/nochat`);
  } catch (error) {
    console.log(error.message);
  }
};

export default connectDB;
