import { DataTypes, Model } from "sequelize";
import db from "./initdb";

interface VendorsInstance extends Model {
  id: number;
  thread_id: number;
  location: string;
  url: string;
}

const VendorsModel = db.define<VendorsInstance>(
  "vendors",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    thread_id: {
      type: DataTypes.INTEGER.UNSIGNED,
    },
    location: {
      type: DataTypes.TEXT,
    },
    url: {
      type: DataTypes.TEXT,
    },
  },
  {
    createdAt: true,
    // maybe I want to update them later? I am not sure.
    updatedAt: false,
  }
);

export default VendorsModel;
