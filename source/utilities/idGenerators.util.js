export const IdGenerators = {
  randomText({ len = 6, type = "number" }) {
    let scope = "";

    if (type === "number") {
      scope = "0123456789";
    } else if (type === "text") {
      scope = "abcdefghijklmnopqrstuvwxyz";
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

export const sluggify = (text) => {
  return text
    .toLowerCase()
    ?.trim()
    .replace(/[^a-z0-9\s]/g, "") // remove special chars (;,.,etc)
    .replace(/\s+/g, "_") // spaces → _
    .replace(/_+/g, "_"); // collapse multiple _
};
