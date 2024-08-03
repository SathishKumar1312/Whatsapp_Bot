# Whatsapp_Bot

This is a chatbot developed by Sathish kumar using nodeJS.
npm Packages used for creating this chatbot are : Whatsapp-web, qrcode, google generative AI.

- If you wish to use this bot, clone this repo in a folder and in the terminal run 'npm install'.
Now the Packages are installed. 
- Before running the program, Get the gemini AI api token and place it in the variable named "geminiToken".
- Now run 'node bot.js' to run the program.
- Go to the localhost port:5000 and wait for the qr code to generate.
- After some time, qr code will be displayed. Scan the qr code with whatsapp.
- That's it. You are authenticated. Program's status would be ready to start. Then you can initiate bot with the *.bot* command when sent by sender.

Some of the commands are :
1) You can send the commands like : *hi*, *portfolio*, *social media*, *resume* to access the respective things.
2) *.bot end* - To end the chat with bot and to continue chat with the real person SK.

This bot is also integrated with Google's gemini AI.
1) *.bot gemini* - To access the google's gemini AI here and you can ask any question.
2) *.bot gemini end* - To close the chat with Gemini AI.

- For more details, send the command : *details*.
- If you would like to fund me, send *fund*.
