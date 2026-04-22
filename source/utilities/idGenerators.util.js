export const IdGenerators = {
  randomText({ len = 6, type = "number" }) {
    let scope = "";

    if (type === "number") {
      scope = "0123456789";
    } else if (type === "text") {
      scope = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    } else if (type === "alpha") {
      scope = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    } else {
      throw new Error("Invalid type. Use 'number', 'text', or 'alpha'");
    }

    let result = "";

    for (let i = 0; i < len; i++) {
      const randomIndex = Math.floor(Math.random() * scope.length);
      result += scope[randomIndex];
    }

    return result;
  },
};
