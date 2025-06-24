const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const verificationCodes = new Map();

function generateVerificationCode(email) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email, code);
  console.log(`Mã xác thực tạo ra cho ${email}: ${code}`);
  return code;
}

function validateVerificationCode(email, code) {
  const storedCode = verificationCodes.get(email);
  if (storedCode === code) {
    verificationCodes.delete(email);
    return true;
  }
  return false;
}

async function sendVerificationEmail(email) {
  try {
    const code = generateVerificationCode(email);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mã xác thực đăng nhập",
      text: `Mã xác thực của bạn là: ${code}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email gửi thành công đến: ${email}`);
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    throw new Error("Không thể gửi email.");
  }
}

async function generateUserCode(db) {
  const usersCollection = db.collection("users");
  const lastUser = await usersCollection.findOne(
    {},
    { sort: { user_code: -1 } }
  );
  if (!lastUser || !lastUser.user_code) return "#UPS001";
  const lastCode = parseInt(lastUser.user_code.replace("#UPS", ""));
  const newCode = lastCode + 1;
  return `#UPS${newCode.toString().padStart(3, "0")}`;
}

async function registerUser(db, name, email, password, avatar, address, phone) {
  const user_code = await generateUserCode(db);
  await db
    .collection("users")
    .insertOne({ user_code, avatar, name, address, phone, email, password });
}

async function findUserByEmail(db, email) {
  return await db.collection("users").findOne({ email });
}

async function updateUserByEmail(db, email, updates) {
  await db.collection("users").updateOne({ email }, { $set: updates });
}

async function hashPassword(password) {
  // Giả định hàm hash (thay bằng bcrypt hoặc tương tự)
  return password; // Thay bằng await bcrypt.hash(password, 10)
}

async function comparePassword(password, hashedPassword) {
  // Giả định hàm compare (thay bằng bcrypt hoặc tương tự)
  return password === hashedPassword; // Thay bằng await bcrypt.compare(password, hashedPassword)
}

module.exports = async (req, res) => {
  const { method, url, body } = req;

  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://pet-shop-urk12.vercel.app"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Xử lý OPTIONS (cho CORS preflight)
  if (method === "OPTIONS") {
    return res.status(200).end();
  }

  // Kết nối database qua env
  const { MongoClient } = require("mongodb");
  const client = new MongoClient(process.env.MONGODB_URI);
  let db;
  try {
    await client.connect();
    db = client.db();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi kết nối database" });
  }

  // Giả định session không dùng trực tiếp, thay bằng token (cần frontend tích hợp)
  const sessionUser = {}; // Thay bằng logic JWT từ req.headers.authorization

  switch (url) {
    case "/user":
      if (method === "GET") {
        if (!sessionUser.email) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        const user = await findUserByEmail(db, sessionUser.email);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
          id: user._id?.toString(),
          name: user.name,
          email: user.email,
          address: user.address,
          phone: user.phone,
        });
      }
      break;

    case "/register":
      if (method === "POST") {
        const {
          name,
          email,
          password,
          confirmPassword,
          avatar,
          address,
          phone,
        } = body;
        if (
          !name ||
          !email ||
          !password ||
          !confirmPassword ||
          !avatar ||
          !address ||
          !phone
        ) {
          return res
            .status(400)
            .json({ message: "Vui lòng nhập đầy đủ thông tin." });
        }
        if (password !== confirmPassword) {
          return res
            .status(400)
            .json({ message: "Mật khẩu xác nhận không khớp." });
        }
        const userExists = await findUserByEmail(db, email);
        if (userExists) {
          return res.status(400).json({ message: "Email đã tồn tại!" });
        }
        const hashedPassword = await hashPassword(password);
        await registerUser(
          db,
          name,
          email,
          hashedPassword,
          avatar,
          address,
          phone
        );
        await sendVerificationEmail(email);
        return res
          .status(201)
          .json({
            message: "Đăng ký thành công! Vui lòng kiểm tra email.",
            user: { name, email },
          });
      }
      break;

    case "/login":
      if (method === "POST") {
        const { email, password } = body;
        if (!email || !password) {
          return res
            .status(400)
            .json({ message: "Vui lòng nhập email và mật khẩu." });
        }
        const user = await findUserByEmail(db, email);
        if (
          !user ||
          !user.password ||
          !(await comparePassword(password, user.password))
        ) {
          return res
            .status(401)
            .json({ message: "Email hoặc mật khẩu không đúng!" });
        }
        // Thay session bằng token (cần frontend lưu token)
        return res.status(200).json({
          message: "Đăng nhập thành công!",
          user: {
            id: user._id?.toString(),
            name: user.name,
            email: user.email,
          },
        });
      }
      break;

    case "/verify-email":
      if (method === "POST") {
        const { email, verificationCode } = body;
        if (!email || !verificationCode) {
          return res.status(400).json({ message: "Thiếu thông tin." });
        }
        const isValid = await validateUserVerificationCode(
          email,
          verificationCode
        );
        if (!isValid) {
          return res.status(400).json({ message: "Mã xác thực không đúng!" });
        }
        return res.status(200).json({ message: "Xác thực thành công!" });
      }
      break;

    case "/send-verification-code":
      if (method === "POST") {
        const { email } = body;
        if (!email) {
          return res.status(400).json({ message: "Email không hợp lệ." });
        }
        const userExists = await findUserByEmail(db, email);
        if (userExists) {
          return res.status(400).json({ message: "Email đã tồn tại!" });
        }
        await sendVerificationEmail(email);
        return res.status(200).json({ message: "Mã xác thực đã được gửi!" });
      }
      break;

    case "/forgot-password":
      if (method === "POST") {
        const { email } = body;
        if (!email) {
          return res.status(400).json({ message: "Email không hợp lệ." });
        }
        const user = await findUserByEmail(db, email);
        if (!user) {
          return res.status(404).json({ message: "Email không tồn tại!" });
        }
        await sendVerificationEmail(email);
        return res
          .status(200)
          .json({
            message: "Mã xác thực đã được gửi! Vui lòng kiểm tra email.",
          });
      }
      break;

    case "/reset-password":
      if (method === "POST") {
        const { email, verificationCode, newPassword, confirmNewPassword } =
          body;
        if (
          !email ||
          !verificationCode ||
          !newPassword ||
          !confirmNewPassword
        ) {
          return res.status(400).json({ message: "Thiếu thông tin." });
        }
        if (newPassword !== confirmNewPassword) {
          return res
            .status(400)
            .json({ message: "Mật khẩu xác nhận không khớp." });
        }
        const isValid = await validateUserVerificationCode(
          email,
          verificationCode
        );
        if (!isValid) {
          return res.status(400).json({ message: "Mã xác thực không đúng!" });
        }
        const user = await findUserByEmail(db, email);
        if (!user) {
          return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }
        const hashedPassword = await hashPassword(newPassword);
        await db
          .collection("users")
          .updateOne({ email }, { $set: { password: hashedPassword } });
        return res
          .status(200)
          .json({ message: "Đặt lại mật khẩu thành công!" });
      }
      break;

    case "/update-profile":
      if (method === "PUT") {
        const { name, address, phone } = body;
        if (!sessionUser.email) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        if (!name || !address || !phone) {
          return res
            .status(400)
            .json({ message: "Vui lòng nhập đầy đủ thông tin." });
        }
        const user = await findUserByEmail(db, sessionUser.email);
        if (!user) {
          return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }
        await updateUserByEmail(db, sessionUser.email, {
          name,
          address,
          phone,
        });
        const updatedUser = await findUserByEmail(db, sessionUser.email);
        return res.status(200).json({
          message: "Cập nhật thông tin thành công!",
          user: {
            id: updatedUser._id?.toString(),
            name,
            email: updatedUser.email,
            address,
            phone,
          },
        });
      }
      break;

    case "/logout":
      if (method === "POST") {
        // Serverless không hỗ trợ session.destroy, cần frontend xóa token
        return res.status(200).json({ message: "Đăng xuất thành công" });
      }
      break;

    case "/session":
      if (method === "GET") {
        if (!sessionUser.email) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        return res.status(200).json({ user: sessionUser });
      }
      break;

    default:
      return res.status(404).json({ message: "Route not found" });
  }

  client.close();
};
