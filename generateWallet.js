const fs = require('fs');
const { ethers } = require("ethers");
const path = require('path');
const { createApiClient, registerWallet } = require('./index');

const WALLET_FILE = path.join(__dirname, 'wallet.json');
const CONFIG_FILE = path.join(__dirname, 'config.txt');

// 新增 sleep 方法
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateWallets(count = 1) {
    const wallets = [];

    for (let i = 0; i < count; i++) {
        const wallet = ethers.Wallet.createRandom();
        wallets.push({
            mnemonic: wallet.mnemonic.phrase,
            privateKey: wallet.privateKey,
            address: wallet.address
        });
    }

    return wallets;
}

function saveWallets(wallets) {
    try {
        let existingData = [];
        if (fs.existsSync(WALLET_FILE)) {
            const rawData = fs.readFileSync(WALLET_FILE, 'utf8');
            existingData = JSON.parse(rawData);
        }

        // 合并新旧数据
        const combinedData = [...existingData, ...wallets];

        if(wallets.length < 1){
            return;
        }

        // 写入合并后的数据
        fs.writeFileSync(WALLET_FILE, JSON.stringify(combinedData, null, 2));
        console.log(`✅ 成功新增 ${wallets.length} 个钱包，当前总计邀请 ${combinedData.length} 个钱包`);

        // 追加地址到配置文件
        const addresses = wallets.map(w => w.address);
        fs.appendFileSync(CONFIG_FILE, '\n' + addresses.join('\n'));
        console.log(`📝 已添加地址至 config.txt 文件末尾`);

    } catch (error) {
        console.error('❌ 文件保存失败:', error.message);
        process.exit(1);
    }
}

async function main() {
    // 执行生成（默认生成1个，可通过参数修改）
    const walletCount = process.argv[2] || 1;
    const wallets = generateWallets(parseInt(walletCount));

    const apiClient = createApiClient('', proxy = '');
    const referredCode = 'TIYN18WW';
    const saveWallet = [];

    for (const wallet of wallets) {
        console.log('------------------------------');
        console.log(`🔑 钱包地址: ${wallet.address} 开始注册，使用邀请码：${referredCode}`);
        // 调用 API 方法
        const res = await registerWallet(apiClient, wallet.address, referredCode);
        if(res) {
            const waitTime = Math.floor(Math.random() * 10000) + 5000;
            console.log(`🔑 钱包地址: ${wallet.address} 注册完成，等待${waitTime / 1000}秒执行下一个...`);
            console.log('------------------------------');
            await sleep(waitTime);
            saveWallet.push(wallet);
        }
    }
    saveWallets(saveWallet);
    console.log('🛡️ 请妥善保管生成的助记词和私钥！');
}

main();
