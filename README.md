# ByData Auto Bot

An automated bot for completing and claiming tasks on the ByData platform to earn XP rewards.

## 📋 Features

- Automatically fetches available tasks from ByData
- Completes and claims XP for pending tasks
- Supports multiple accounts
- Proxy support (HTTP/HTTPS/SOCKS)
- Rate limiting protection
- Detailed statistics and logging

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/airdropinsiders/ByData-Auto-Bot.git
cd ByData-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

## ⚙️ Configuration

### Setting up your accounts

Create a `config.txt` file in the project root with the following format:
```
walletAddress|token
```

Example:
```
0x1234567890abcdef1234567890abcdef12345678|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
0xabcdef1234567890abcdef1234567890abcdef12|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Setting up proxies (Optional)

Create a `proxies.txt` file in the project root with one proxy per line:

```
ip:port
username:password@ip:port
socks5://ip:port
```

Example:
```
192.168.1.1:8080
user123:pass456@192.168.1.2:8080
socks5://192.168.1.3:1080
```

## 🚀 Usage

Run the bot with:

```bash
npm run start
```

## 📊 Output

The bot will display:
- Initial statistics for each account
- Progress of each task (completion and claiming)
- Final statistics showing XP earned and tasks completed

Example output:
```
====================================================================
                   ByData Auto Bot - Airdrop Insiders
====================================================================

Loaded 2 accounts from config file
Loaded 3 proxies from proxies file

==== Processing account: 0x1234...5678 ====
Using proxy: 192.168.1.1:8080
Found 5 tasks in SOCIAL category
Found 3 tasks in PARTNERS category

Initial status:
===== TASK STATISTICS =====
Wallet: 0x1234...5678
Total Tasks: 8
Completed Tasks: 3
Claimed Tasks: 2
Total XP Rewarded: 150
===========================

🔄 Processing: Follow on Twitter (task123) - SOCIAL
✅ Task task123 completed successfully
🏆 XP for task task123 claimed successfully
✨ Finished: Follow on Twitter
-----------------------------------

[... more task outputs ...]

Final status:
===== TASK STATISTICS =====
Wallet: 0x1234...5678
Total Tasks: 8
Completed Tasks: 8
Claimed Tasks: 8
Total XP Rewarded: 600
===========================

Waiting 5 seconds before processing next account...
```

## ⚠️ Important Notes

- This bot uses your authentication token, so be careful with your `config.txt` file
- Using proxies is recommended to avoid IP bans
- The bot implements delays between actions to avoid rate limiting
- For best results, use high-quality proxies that are not blocked by the ByData API

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/airdropinsiders/ByData-Auto-Bot/issues).

## 刷邀请

修改 generateWallet.js 中的邀请码

```
node generateWallet.js 1(邀请数量)
```
