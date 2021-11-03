import { DataTypes, Model } from "sequelize";
import db from "./initdb";

interface ImagesInstance extends Model {
  id: number;
  thread_id: number;
  name: string;
  url: string;
  is_hidden: boolean;
  order_number: number;
}

const ImagesModel = db.define<ImagesInstance>(
  "images",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    thread_id: {
      type: DataTypes.INTEGER.UNSIGNED,
    },
    name: {
      type: DataTypes.STRING,
    },
    url: {
      type: DataTypes.STRING,
    },
    is_hidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order_number: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: true,
    createdAt: "scraped",
    updatedAt: false,
  }
);

export default ImagesModel;
