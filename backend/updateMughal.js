const mongoose = require('mongoose');
const Course = require('./models/course');

mongoose.connect('mongodb://127.0.0.1:27017/userlogin').then(async () => {
  const mughalCourse = await Course.findOne({ courseName: { $regex: /mughal/i } });
  if (mughalCourse) {
    console.log("Found:", mughalCourse.courseName, mughalCourse._id);
    
    if (mughalCourse.lectures && mughalCourse.lectures.length > 0) {
       mughalCourse.lectures[0].videoUrl = "https://www.youtube.com/embed/kY0wU3YI6A0"; // Epic History: Mughal Empire
    } else {
       mughalCourse.lectures.push({
           lectureTitle: "The Mughal Empire",
           videoUrl: "https://www.youtube.com/embed/kY0wU3YI6A0"
       });
    }
    
    await mughalCourse.save();
    console.log("Updated video link.");
  } else {
    console.log("No Mughal course found.");
  }
  process.exit(0);
});
