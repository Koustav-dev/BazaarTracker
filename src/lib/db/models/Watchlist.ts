import mongoose, { Document, Schema } from "mongoose";
export interface IWatchlistItem { symbol: string; name: string; exchange: "NSE"|"BSE"; addedAt: Date; }
export interface IWatchlist extends Document { userId: mongoose.Types.ObjectId; stocks: IWatchlistItem[]; }
const ItemSchema = new Schema<IWatchlistItem>(
  { symbol: { type: String, required: true }, name: { type: String, required: true },
    exchange: { type: String, enum: ["NSE","BSE"], required: true }, addedAt: { type: Date, default: Date.now } },
  { _id: false }
);
const WatchlistSchema = new Schema<IWatchlist>(
  { userId: { type: String, required: true },
    stocks: { type: [ItemSchema], default: [] } },
  { timestamps: true }
);
export const Watchlist = mongoose.models.Watchlist || mongoose.model<IWatchlist>("Watchlist", WatchlistSchema);
