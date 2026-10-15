// const mongoose = require('mongoose');

// const BusinessHourSchema = new mongoose.Schema({
//   entityId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     refPath: 'entityType',
//   },
//   entityType: { type: String, enum: ['Shop', 'Staff'], required: true },
//   day: {
//     type: String,
//     enum: [
//       'Sunday',
//       'Monday',
//       'Tuesday',
//       'Wednesday',
//       'Thursday',
//       'Friday',
//       'Saturday',
//     ],
//     required: true,
//   },
//   openTime: { type: String }, // Format: "HH:mm"
//   closeTime: { type: String },
//   isClosed: { type: Boolean, default: false },
// });

// const BlockHourSchema = new mongoose.Schema({
//   entityId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     refPath: 'entityType',
//   },
//   entityType: { type: String, enum: ['Shop', 'Staff'], required: true },
//   day: { type: String, required: true },
//   startTime: { type: String, required: true },
//   endTime: { type: String, required: true },
// });

// module.exports = {
//   BusinessHour: mongoose.model('BusinessHour', BusinessHourSchema),
//   BlockHour: mongoose.model('BlockHour', BlockHourSchema),
// };

// const ShopSchema = new mongoose.Schema({
//     name: String,
//     address: String,
//   });

//   const StaffSchema = new mongoose.Schema({
//     name: String,
//     shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
//     services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
//   });

//   const BookingSchema = new mongoose.Schema({
//     customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
//     staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
//     serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
//     startTime: Date,
//     endTime: Date,
//     status: { type: String, enum: ['booked', 'completed', 'canceled'], default: 'booked' }
//   });

//   module.exports = {
//     Shop: mongoose.model('Shop', ShopSchema),
//     Staff: mongoose.model('Staff', StaffSchema),
//     Booking: mongoose.model('Booking', BookingSchema),
//   };

// available dates-------------------------------------------------------------------

// const getAvailableDates = async (staffId) => {
//     const today = new Date();
//     const nextFiveDays = [];

//     const staff = await Staff.findById(staffId);
//     if (!staff) throw new Error('Staff not found');

//     const shopHours = await BusinessHour.find({ entityId: staff.shopId, entityType: 'Shop' });
//     const staffHours = await BusinessHour.find({ entityId: staffId, entityType: 'Staff' });

//     for (let i = 0; i < 5; i++) {
//       const date = new Date(today);
//       date.setDate(today.getDate() + i);
//       const day = date.toLocaleDateString('en-US', { weekday: 'long' });

//       const shopDayHours = shopHours.find(hour => hour.day === day);
//       const staffDayHours = staffHours.find(hour => hour.day === day);

//       if (shopDayHours && staffDayHours && !shopDayHours.isClosed && !staffDayHours.isClosed) {
//         nextFiveDays.push({
//           date: date.toISOString().split('T')[0],
//           isAvailable: true,
//           openTime: staffDayHours.openTime,
//           closeTime: staffDayHours.closeTime,
//         });
//       } else {
//         nextFiveDays.push({
//           date: date.toISOString().split('T')[0],
//           isAvailable: false,
//         });
//       }
//     }
//     return nextFiveDays;
//   };

// get available time slots-------------------------------------

//   const getAvailableTimeSlots = async (staffId, date) => {
//     const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
//     const staffHours = await BusinessHour.findOne({ entityId: staffId, entityType: 'Staff', day });
//     if (!staffHours || staffHours.isClosed) return { availableSlots: [] };

//     const openTime = new Date(`${date}T${staffHours.openTime}`);
//     const closeTime = new Date(`${date}T${staffHours.closeTime}`);

//     const blockHours = await BlockHour.find({ entityId: staffId, entityType: 'Staff', day });
//     const existingBookings = await Booking.find({
//       staffId,
//       startTime: { $gte: openTime, $lt: closeTime },
//     });

//     const availableSlots = [];
//     let slotStart = new Date(openTime);

//     while (slotStart < closeTime) {
//       const slotEnd = new Date(slotStart);
//       slotEnd.setMinutes(slotStart.getMinutes() + 30);

//       const isBlocked = blockHours.some(bh =>
//         slotStart.toISOString().slice(11, 16) >= bh.startTime &&
//         slotStart.toISOString().slice(11, 16) < bh.endTime
//       );
//       const isBooked = existingBookings.some(b =>
//         slotStart >= b.startTime && slotEnd <= b.endTime
//       );

//       if (!isBlocked && !isBooked) {
//         availableSlots.push(slotStart.toISOString().slice(11, 16));
//       }
//       slotStart = slotEnd;
//     }

//     return { availableSlots };
//   };

//
// calculate service minutes ----------------------
// const calculateTotalServiceTime = async (serviceIds) => {
//     const services = await Service.find({ _id: { $in: serviceIds } });
//     return services.reduce((total, service) => total + service.duration, 0);
//   };

// get avaialbe slot-----------------
// const getAvailableTimeSlots = async (staffId, date, serviceIds) => {
//     const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

//     // Calculate total time needed based on selected services
//     const totalDuration = await calculateTotalServiceTime(serviceIds);

//     // Retrieve business hours for the selected day
//     const staffHours = await BusinessHour.findOne({ entityId: staffId, entityType: 'Staff', day });
//     if (!staffHours || staffHours.isClosed) return { availableSlots: [] };

//     const openTime = new Date(`${date}T${staffHours.openTime}`);
//     const closeTime = new Date(`${date}T${staffHours.closeTime}`);

//     // Retrieve block hours and existing bookings for the day
//     const blockHours = await BlockHour.find({ entityId: staffId, entityType: 'Staff', day });
//     const existingBookings = await Booking.find({
//       staffId,
//       startTime: { $gte: openTime, $lt: closeTime },
//     });

//     const availableSlots = [];
//     let slotStart = new Date(openTime);

//     while (slotStart < closeTime) {
//       const slotEnd = new Date(slotStart);
//       slotEnd.setMinutes(slotStart.getMinutes() + totalDuration);

//       // Ensure the slot end time does not exceed business hours
//       if (slotEnd > closeTime) break;

//       // Check if the slot conflicts with block hours
//       const isBlocked = blockHours.some(bh =>
//         (slotStart.toISOString().slice(11, 16) >= bh.startTime && slotStart.toISOString().slice(11, 16) < bh.endTime) ||
//         (slotEnd.toISOString().slice(11, 16) > bh.startTime && slotEnd.toISOString().slice(11, 16) <= bh.endTime)
//       );

//       // Check if the slot conflicts with existing bookings
//       const isBooked = existingBookings.some(b =>
//         (slotStart < b.endTime && slotEnd > b.startTime)
//       );

//       // Add slot with `isBooked` flag
//       availableSlots.push({
//         time: slotStart.toISOString().slice(11, 16),
//         isBooked: isBlocked || isBooked,
//       });

//       // Move to the next 30-minute slot
//       slotStart.setMinutes(slotStart.getMinutes() + 30);
//     }

//     return { availableSlots };
//   };

/// booking-------------------------
// app.post('/bookings', async (req, res) => {
//     const { customerId, staffId, serviceIds, date, startTime } = req.body;

//     // Calculate the total time for selected services
//     const totalDuration = await calculateTotalServiceTime(serviceIds);

//     const start = new Date(`${date}T${startTime}`);
//     const end = new Date(start);
//     end.setMinutes(start.getMinutes() + totalDuration);

//     // Verify that the slot is still available
//     const availableSlots = await getAvailableTimeSlots(staffId, date, serviceIds);
//     const selectedSlot = availableSlots.find(slot => slot.time === start.toISOString().slice(11, 16));

//     if (!selectedSlot || selectedSlot.isBooked) {
//       return res.status(400).json({ error: 'Selected time slot is no longer available' });
//     }

//     // Create the booking
//     const newBooking = new Booking({
//       customerId,
//       staffId,
//       serviceIds,
//       startTime: start,
//       endTime: end,
//       status: 'booked'
//     });
//     await newBooking.save();

//     res.status(201).json({ message: 'Booking successful', booking: newBooking });
//   });

// -00000000000000000000000000000000000000000
// const dayjs = require('dayjs');
// const utc = require('dayjs/plugin/utc');
// const timezone = require('dayjs/plugin/timezone');
// const httpStatus = require("http-status");
// const Auction = require("../../app/modules/auction/auction.model");
// const Notification = require("../../app/modules/notification/notification.model");
// const ApiError = require("../../errors/ApiError");
// const { ENUM_AUCTION_STATUS } = require("../../utils/enums");
// const getUpdatedAuction = require("../../helpers/getUpdatedAuctiion");
// const User = require("../../app/modules/user/user.model");
// const placeRandomBid = require("../../helpers/placeRandomBid");

// // Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);

// const createAuctionIntoDB = async (data, clientTimeZone) => {
//   try {
//     // Parse and convert input dates to UTC before storing
//     const startingDateTime = dayjs.tz(`${data.startingDate} ${data.startingTime}`, 'YYYY-MM-DD HH:mm', clientTimeZone).utc();
//     const endingDateTime = dayjs.tz(`${data.endingDate} ${data.endingTime}`, 'YYYY-MM-DD HH:mm', clientTimeZone).utc();

//     // Validate that dates are in the future
//     if (endingDateTime.isBefore(dayjs().utc())) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "Please add a future ending date.");
//     }
//     if (startingDateTime.isBefore(dayjs().utc())) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "Please add a future starting date.");
//     }

//     // Store the UTC time in the data object
//     data.startingDateTime = startingDateTime.toDate(); // Store as a UTC JavaScript Date object
//     data.activateDateTime = endingDateTime.toDate();   // Store as a UTC JavaScript Date object

//     // Create auction in the database
//     const result = await Auction.create(data);
//     if (!result) {
//       throw new ApiError(
//         httpStatus.INTERNAL_SERVER_ERROR,
//         "Auction not created, try again."
//       );
//     }

//     // Format the starting date for notifications (in the client's local time zone for display)
//     const formattedDate = startingDateTime.tz(clientTimeZone).format('MMMM D, YYYY h:mm A');
//     const notificationMessage = `${data?.name} has been successfully created and scheduled to start on ${formattedDate} (your local time).`;

//     // Create a notification for the admin
//     await Notification.create({
//       message: notificationMessage,
//       receiver: ENUM_USER_ROLE.ADMIN,
//     });

//     // Send notifications to the admin
//     const adminUnseenNotificationCount = await getAdminNotificationCount();
//     global.io.emit("admin-notification", adminUnseenNotificationCount);

//     return result;
//   } catch (err) {
//     if (err instanceof ApiError) {
//       throw err;
//     }
//     if (err instanceof mongoose.Error.ValidationError) {
//       const messages = Object.values(err.errors).map((error) => error.message);
//       throw new ApiError(httpStatus.BAD_REQUEST, messages.join(", "));
//     }

//     throw new ApiError(
//       httpStatus.SERVICE_UNAVAILABLE,
//       "Something went wrong. Try again later."
//     );
//   }
// };

// let isRunning = false;

// const updateAuctionStatuses = async () => {
//   if (isRunning) return;
//   isRunning = true;

//   const currentTime = dayjs().utc(); // Current UTC time
//   const fiveSecondsLater = currentTime.add(5, 'second');
//   const nineSecondsLater = currentTime.add(9, 'second');

//   try {
//     // Activate upcoming auctions
//     const auctionsToActivate = await Auction.updateMany(
//       {
//         startingDateTime: { $lte: currentTime.toDate() }, // Compare in UTC
//         status: ENUM_AUCTION_STATUS.UPCOMING,
//       },
//       {
//         $set: { status: ENUM_AUCTION_STATUS.ACTIVE, countdownTime: 9 },
//       }
//     );
//     console.log(`Activated ${auctionsToActivate.modifiedCount} auctions.`);

//     // Broadcast activated auctions
//     const activatedAuctions = await Auction.find({
//       status: ENUM_AUCTION_STATUS.ACTIVE,
//       startingDateTime: {
//         $gte: currentTime.subtract(500, 'millisecond').toDate(),
//         $lt: currentTime.toDate(),
//       },
//     });

//     for (const auction of activatedAuctions) {
//       const updatedActiveAuction = await getUpdatedAuction(auction._id);
//       global.io.to(auction._id.toString()).emit("bidHistory", { updatedAuction: updatedActiveAuction });
//       global.io.emit("updated-auction", { updatedAuction: updatedActiveAuction });
//     }

//     // Emit all auctions for global update
//     const allAuctions = await Auction.find();
//     global.io?.emit("allAuctions", allAuctions);

//     // Handle auctions ready for bidBuddy bids
//     const readyAuctionsForBidBuddyBid = await Auction.find({
//       activateTime: { $gte: currentTime.toDate(), $lte: fiveSecondsLater.toDate() },
//       status: ENUM_AUCTION_STATUS.ACTIVE,
//     });

//     for (const auction of readyAuctionsForBidBuddyBid) {
//       console.log("Placing random bid for auction ID:", auction._id);
//       await placeRandomBid(auction._id);
//     }

//     // Mark auctions as completed if activateTime is less than or equal to current time
//     const auctionsToComplete = await Auction.updateMany(
//       {
//         activateTime: { $lte: currentTime.toDate() },
//         status: ENUM_AUCTION_STATUS.ACTIVE,
//       },
//       {
//         $set: { status: ENUM_AUCTION_STATUS.COMPLETED, countdownTime: 0 },
//       }
//     );
//     console.log(`Completed ${auctionsToComplete.modifiedCount} auctions.`);

//     // Find and broadcast completed auctions
//     if (auctionsToComplete.modifiedCount > 0) {
//       const completedAuctions = await Auction.find({
//         status: ENUM_AUCTION_STATUS.COMPLETED,
//         updatedAt: { $gte: currentTime.subtract(1, 'minute').toDate() },
//       });

//       for (const completedAuction of completedAuctions) {
//         const updatedCompletedAuction = await getUpdatedAuction(completedAuction._id);
//         global.io.to(completedAuction._id.toString()).emit("bidHistory", { updatedAuction: updatedCompletedAuction });
//         global.io.emit("updated-auction", { updatedAuction: updatedCompletedAuction });

//         // Handle returning bids to the winning bidder if they used bidBuddy
//         const winningBidderId = completedAuction?.winingBidder?.user;
//         if (winningBidderId) {
//           await User.findByIdAndUpdate(winningBidderId, { $inc: { totalWin: 1 } });

//           const winningBidderBuddy = completedAuction.bidBuddyUsers.find(
//             (buddy) => String(buddy.user) === String(winningBidderId)
//           );

//           if (winningBidderBuddy) {
//             const remainingBids = winningBidderBuddy.availableBids;
//             await User.findByIdAndUpdate(winningBidderId, { $inc: { availableBid: remainingBids } });
//             console.log(`Added ${remainingBids} bids to user ${winningBidderId}`);
//           } else {
//             console.log("Winning bidder not found in bidBuddyUsers");
//           }
//         } else {
//           console.log("No winning bidder for auction", completedAuction._id);
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error updating auctions:", error);
//   } finally {
//     isRunning = false;
//   }
// };

// // Schedule to run the update function every second
// setInterval(updateAuctionStatuses, 1000);

// cvc format

// Import necessary modules
// const express = require('express');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const csv = require('csv-parser');
// const fs = require('fs');

// // Initialize Express app
// const app = express();

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/sportsDB', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// // Define Mongoose Schemas
// const LeagueSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   image: String,
//   sport: String
// });

// const TeamSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   logo: String,
//   sports: String,
//   bgImage: String,
//   league: { type: mongoose.Schema.Types.ObjectId, ref: 'League' }
// });

// const PlayerSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   league: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },
//   team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
//   position: String,
//   bgImage: String,
//   image: String
// });

// // Create Mongoose Models
// const League = mongoose.model('League', LeagueSchema);
// const Team = mongoose.model('Team', TeamSchema);
// const Player = mongoose.model('Player', PlayerSchema);

// // Configure multer for CSV upload
// const upload = multer({ dest: 'uploads/' });

// // Route to handle CSV upload
// app.post('/upload', upload.single('file'), (req, res) => {
//   const filePath = req.file.path;
//   const results = [];

//   fs.createReadStream(filePath)
//     .pipe(csv())
//     .on('data', (data) => results.push(data))
//     .on('end', async () => {
//       try {
//         for (const row of results) {
//           const { leagueName, leagueImage, sport, teamName, teamLogo, teamSports, teamBgImage, playerName, playerPosition, playerBgImage, playerImage } = row;

//           // Find or create League
//           let league = await League.findOne({ name: leagueName });
//           if (!league) {
//             league = new League({ name: leagueName, image: leagueImage, sport });
//             await league.save();
//           }

//           // Find or create Team
//           let team = await Team.findOne({ name: teamName, league: league._id });
//           if (!team) {
//             team = new Team({ name: teamName, logo: teamLogo, sports: teamSports, bgImage: teamBgImage, league: league._id });
//             await team.save();
//           }

//           // Create Player
//           const player = new Player({
//             name: playerName,
//             league: league._id,
//             team: team._id,
//             position: playerPosition,
//             bgImage: playerBgImage,
//             image: playerImage
//           });
//           await player.save();
//         }

//         // Delete the file after processing
//         fs.unlinkSync(filePath);

//         res.status(200).send('Data successfully uploaded and saved.');
//       } catch (error) {
//         res.status(500).send(`Error processing data: ${error.message}`);
//       }
//     });
// });

// // Start the Express server
// app.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });

// Example CSV format:
// leagueName,leagueImage,sport,teamName,teamLogo,teamSports,teamBgImage,playerName,playerPosition,playerBgImage,playerImage
// Premier League,premier_league_logo.png,Football,Manchester United,man_utd_logo.png,Football,man_utd_bg.png,Cristiano Ronaldo,Forward,ronaldo_bg.png,ronaldo_image.png
// La Liga,la_liga_logo.png,Football,Real Madrid,real_madrid_logo.png,Football,real_madrid_bg.png,Luka Modric,Midfielder,modric_bg.png,modric_image.png
// Serie A,serie_a_logo.png,Football,Juventus,juventus_logo.png,Football,juventus_bg.png,Federico Chiesa,Winger,chiesa_bg.png,chiesa_image.png
