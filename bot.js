const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs"); // For reading the media file
const path = require("path");
const http = require("http");

const geminiToken = "YOUR_GEMINI_API_TOKEN"
// Creating instances
const genAI = new GoogleGenerativeAI(geminiToken);
const client = new Client({
  authStrategy: new LocalAuth(),
});

// Initializing GenAI model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Object to store chat states for each user
const chatStates = {};

// Function to generate response from AI model and reply to user
async function generate(prompt, message) {
  const userChatState = chatStates[message.from];
  if (userChatState && userChatState.geminiChatActive) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (typeof text === "string") {
        await message.reply(text); // Reply to user
      } else {
        await message.reply(
          "Sorry, there was an error processing your request."
        );
      }
    } catch (error) {
      console.error(error);
      await message.reply("Sorry, there was an error processing your request.");
    }
  }
}

// Function to send media file
async function sendMedia(message, filePath, caption = "") {
  const media = MessageMedia.fromFilePath(filePath);
  await client.sendMessage(message.from, media, { caption: caption });
}

// All event listeners to know client status
let qrCodeDataURI;
// Generate QR code data URI
client.on("qr", async (qrData) => {
  qrCodeDataURI = await generateQRCode(qrData);
});

client.on("authenticated", () => {
  console.log("Client is authenticated!");
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("disconnected", () => {
  console.log("Client is disconnected!");
});

client.on("auth_failure", () => {
  console.log("Client is auth_failure!");
});

const generateQRCode = async (text) => {
  try {
    const options = {
      width: 50, // Adjusted to a more practical small size
      margin: 0, // No margin to keep it as small as possible
    };

    // Generate QR code as a data URI
    const qrCodeDataURI = await qrcode.toDataURL(text, options);
    console.log("QR code created successfully", qrCodeDataURI);
    return qrCodeDataURI;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });

    if (qrCodeDataURI) {
      // Embed the QR code image in the HTML
      res.write(
        `<html><body><img src="${qrCodeDataURI}" alt="QR Code"></body></html>`
      );
    } else {
      res.write(`<html><body><p>Failed to generate QR code.</p></body></html>`);
    }

    res.end();
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.write(`<html><body><p>Not Found</p></body></html>`);
    res.end();
  }
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});

const resumeFilePath = path.join(__dirname, "Sathishkumar_Resume.pdf");
const gpayFilePath = path.join(__dirname, "GooglePay_QR.png");

// Function to log messages to a file
function logMessageToFile(message) {
  const logFilePath = path.join(__dirname, "message_logs.txt");
  const logMessage = `${new Date()} - ${message.from}: ${message.body}\n`;
  fs.appendFileSync(logFilePath, logMessage);
}

client.on("message", async (message) => {
  // Initialize chat state if not already done
  if (!chatStates[message.from]) {
    chatStates[message.from] = {
      botChatActive: false,
      geminiChatActive: false,
    };
  }

  const userChatState = chatStates[message.from];

  if (message.body.startsWith(".bot")) {
    const args = message.body.split(" ");
    const command = args[1];
    const firstCommand = args[2];
    const secondCommand = args[3];

    userChatState.botChatActive = true;
    if (message.body === ".bot" || message.body === ".bot start") {
      await message.reply("Bot has been activated.");
      await message.reply(
        "Hello, this is SathishKumar. This is a chat bot.\nDeveloped by ©️SathishKumar💖\n\nFor the list of commands, type and send *command*"
      );
    }

    if (command === "end" && firstCommand == undefined) {
      userChatState.botChatActive = false;
      userChatState.geminiChatActive = false;
      await message.reply("Signing off...");
      await message.reply(
        "Bot chat has been ended. You can continue chat with Real Person."
      );
      return;
    }
    if (command === "gemini" && firstCommand == undefined) {
      userChatState.geminiChatActive = true;
      await message.reply(
        "Google's Gemini chat has started. If you would like to end, send *.bot gemini end*."
      );
      return;
    }
    if (
      command === "gemini" &&
      firstCommand == "end" &&
      secondCommand == undefined
    ) {
      userChatState.geminiChatActive = false;
      await message.reply("Google's Gemini chat has ended.");
      return;
    } else if (command) {
      if (userChatState.geminiChatActive) {
        const query = message.body.replace(".bot", "").trim();
        generate(query, message);
      } else {
        message.reply(
          "Do not use .bot for queries. You may type and send without ' .bot '.Instead, if you still want to use .bot command in front of queries, you may turn on the Gemini by ' .bot gemini ' and you can use .bot command in front."
        );
      }
    }
  } else if (userChatState.botChatActive) {
    logMessageToFile(message);
    if (message.body.toLowerCase() === "home") {
      message.reply(
        "Hello, this is SathishKumar. This is a chat bot.\nDeveloped by ©️SathishKumar💖"
      );
    } else if (
      message.body.toLowerCase() === "commands" ||
      message.body.toLowerCase() === "command"
    ) {
      message.reply(
        "Send the commands such as\n\n1) You can send the commands like : *hi*, *portfolio*, *social media*, *resume* to access the respective things.\n2) *.bot end* - To end the chat with bot and to continue chat with the real person SK\n\nThis bot is also integrated with Google's gemini AI.\n\n1) *.bot gemini* - To access the google's gemini AI here and you can ask any question.\n2) *.bot gemini end* - To close the chat with Gemini AI\n\nFor more details, send the command : *details*\nIf you would like to fund me, send *fund*."
      );
    } else if (message.body.toLowerCase() === "hi") {
      message.reply("Hello, this is SK.");
    } else if (message.body.toLowerCase() === "details" || message.body.toLowerCase() === "detail") {
      message.reply(
        `This is a chatbot developed by Sathish kumar using nodeJS.\nnpm Packages used for creating this chatbot are : Whatsapp-web, qrcode, google generative AI.\n\nIf you are interested to see the code, check at\nhttps://github.com/SathishKumar1312/Whatsapp_Bot \nIf you would like to fund me : send command *fund*`
      );
    } else if (message.body.toLowerCase() == "fund" || message.body.toLowerCase() == "funds") {
      message.reply("It would be more helpful");
      await sendMedia(message, gpayFilePath, "Gpay QR Code");
    } else if (message.body == "full name") {
      message.reply("Sathish Kumar M");
    } else if (message.body.toLowerCase() == "bye") {
      message.reply(
        "Bye. If you would like to end the chat with the bot, then send the command: *.bot end*"
      );
    } else if (message.body.toLowerCase() === "portfolio") {
      message.reply("sathishkumarm.me/");
    } else if (
      message.body.toLowerCase() === "social media" ||
      message.body.toLowerCase() === "link" ||
      message.body.toLowerCase() === "links"
    ) {
      message.reply(
        "Portfolio: https://sathishkumarm.me/\n\nInstagram: http://www.instagram.com/_.sathish._.kumar._\nLinked-In: https://www.linkedin.com/in/sathish-kumar-m-b44933265/\nGithub: http://github.com/SathishKumar1312\nMail to: sathishmskcs1312@gmail.com"
      );
    } else if (message.body.toLowerCase() === "resume") {
      message.reply("Sending resume...");
      if (fs.existsSync(resumeFilePath)) {
        sendMedia(message, resumeFilePath, "Here is my resume.");
      } else {
        message.reply("Resume file not found. Please check the file path.");
      }
    } else if (userChatState.geminiChatActive) {
      generate(message.body, message);
    } else {
      message.reply(
        "Invalid command. For the list of commands, type and send *command*"
      );
    }
  }

  // Command to send media file
  if (message.body.startsWith(".sendMedia")) {
    const [_, filePath, ...captionParts] = message.body.split(" ");
    const caption = captionParts.join(" ");

    if (fs.existsSync(filePath)) {
      sendMedia(message, filePath, caption);
    } else {
      message.reply("File not found. Please check the file path.");
    }
  }
});

client.initialize();
