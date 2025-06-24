module.exports = (req, res) => {
  const { method, url, body, query } = req;

  // Thêm CORS
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

  // Giả định kết nối database qua env (thay bằng logic thực tế)
  const db = {}; // Thay bằng kết nối MongoDB từ process.env.MONGODB_URI

  switch (url) {
    case "/":
      if (method === "GET") {
        // Giả định getAllArticles là hàm từ models
        const articles = []; // Thay bằng await getAllArticles(db)
        if (!Array.isArray(articles)) {
          return res
            .status(500)
            .json({ error: "Articles data is not an array" });
        }
        return res.status(200).json(articles);
      } else if (method === "POST") {
        const articlesData = Array.isArray(body) ? body : [body];
        for (const article of articlesData) {
          const { title, description, name, image, category } = article;
          if (!title || !description || !name || !image || !category) {
            return res
              .status(400)
              .json({
                error:
                  "Title, description, name, image, and category are required for each article",
              });
          }
        }
        // Giả định createArticles là hàm từ models
        const newArticles = []; // Thay bằng await createArticles(db, articlesData)
        return res
          .status(201)
          .json({
            message: "Articles created successfully",
            articles: newArticles,
          });
      }
      break;

    default:
      return res.status(404).json({ message: "Route not found" });
  }
};
