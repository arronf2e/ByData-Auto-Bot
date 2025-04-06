const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

const API_BASE_URL = 'https://mega-api.bydata.app/v1';
const CONFIG_FILE = 'config.txt';
const PROXIES_FILE = 'proxies.txt';

function displayBanner() {
  const banner = `
====================================================================
                   ByData Auto Bot - Airdrop Insiders
====================================================================
`;
  console.log(banner);
}

async function readConfig() {
  try {
    const configContent = await fs.promises.readFile(CONFIG_FILE, 'utf8');
    const configs = configContent.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    const accounts = [];
    
    for (const config of configs) {
      accounts.push({ walletAddress: config, token: '' });
    }
    
    console.log(`Loaded ${accounts.length} accounts from config file`);
    return accounts;
  } catch (error) {
    console.error('Error reading config file:', error.message);
    console.log('Make sure you have a config.txt file with format: walletAddress|token');
    process.exit(1);
  }
}

async function readProxies() {
  try {
    const exists = await fs.promises.access(PROXIES_FILE).then(() => true).catch(() => false);
    if (!exists) {
      console.log('No proxies.txt file found. Will proceed without proxies.');
      return [];
    }
    
    const proxiesContent = await fs.promises.readFile(PROXIES_FILE, 'utf8');
    const proxies = proxiesContent.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    console.log(`Loaded ${proxies.length} proxies from proxies file`);
    return proxies;
  } catch (error) {
    console.error('Error reading proxies file:', error.message);
    return [];
  }
}

function createProxyAgent(proxy) {
  if (!proxy) return null;
  
  try {
    if (proxy.startsWith('socks://') || proxy.startsWith('socks4://') || proxy.startsWith('socks5://')) {
      return new SocksProxyAgent(proxy);
    }
    
    if (proxy.includes('@') && !proxy.startsWith('http://') && !proxy.startsWith('https://')) {
      const [auth, address] = proxy.split('@');
      const [user, pass] = auth.split(':');
      const [host, port] = address.split(':');
      
      return new HttpsProxyAgent({
        host,
        port,
        auth: `${user}:${pass}`
      });
    }
    
    if (!proxy.startsWith('http://') && !proxy.startsWith('https://')) {
      const [host, port] = proxy.split(':');
      
      return new HttpsProxyAgent({
        host,
        port
      });
    }
    
    return new HttpsProxyAgent(proxy);
  } catch (error) {
    console.error(`Error creating proxy agent for ${proxy}:`, error.message);
    return null;
  }
}

function createApiClient(token, proxy = null) {
  const config = {
    baseURL: API_BASE_URL,
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.7',
      'content-type': 'application/json',
      'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'sec-gpc': '1',
      'Referer': 'https://bydata.app/',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Authorization': `Bearer ${token}`
    },
    timeout: 30000, 
  };
  
  if (proxy) {
    try {
      const agent = createProxyAgent(proxy);
      if (agent) {
        config.httpsAgent = agent;
        config.proxy = false; 
      }
    } catch (error) {
      console.error(`Error setting up proxy for ${proxy}:`, error.message);
    }
  }
  
  return axios.create(config);
}

async function makeApiRequest(apiClient, method, url, data = null) {
  try {
    const config = {
      method,
      url,
      ...(data && { data })
    };
    
    return await apiClient(config);
  } catch (error) {
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('socket disconnected')) {
      console.error(`Network error (${error.code || 'connection issue'}). Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        return await apiClient({
          method,
          url,
          ...(data && { data })
        });
      } catch (retryError) {
        throw retryError;
      }
    }
    
    throw error;
  }
}

async function fetchTasks(apiClient, walletAddress) {
  try {
    const response = await makeApiRequest(
      apiClient,
      'get',
      `/social/actions/${walletAddress}`
    );

    const tasks = response.data?.data.socialActions || [];
    console.log(`Found ${tasks.length} tasks`);
    return tasks;
  } catch (error) {
    console.error(`Error fetching tasks:`, error.response?.data || error.message);
    return [];
  }
}

async function completeTask(apiClient, walletAddress, taskId) {
  try {
    const payload = {
      walletAddress,
      id: taskId
    };
    
    const response = await makeApiRequest(
      apiClient,
      'post',
      '/social/actions/complete',
      payload
    );
    
    console.log(`✅ Task ${taskId} completed successfully`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error completing task ${taskId}:`, error.response?.data || error.message);
    return null;
  }
}

async function claimTask(apiClient, walletAddress, taskId) {
  try {
    const payload = {
      walletAddress,
      templateId: taskId
    };
    
    const response = await makeApiRequest(
      apiClient,
      'post',
      '/social/actions/claim',
      payload
    );
    
    console.log(`🏆 XP for task ${taskId} claimed successfully`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error claiming task ${taskId}:`, error.response?.data || error.message);
    return null;
  }
}

async function processTasksWithDelay(apiClient, walletAddress, tasks) {
  for (const task of tasks) {
    if (task.completed && task.claimed) {
      console.log(`⏩ Task "${task.title}" already completed and claimed. Skipping...`);
      continue;
    }
    
    console.log(`\n🔄 Processing: ${task.title} (${task.id}) - ${task.category}`);
    
    if (!task.completed) {
      await completeTask(apiClient, walletAddress, task.id);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    if (!task.claimed) {
      await claimTask(apiClient, walletAddress, task.id);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log(`✨ Finished: ${task.title}`);
    console.log('-----------------------------------');
    
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
}

function displayStats(allTasks, walletAddress) {
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(task => task.completed).length;
  const claimedTasks = allTasks.filter(task => task.claimed).length;
  const totalXP = allTasks.reduce((sum, task) => sum + (task.claimed ? task.xpRewarded : 0), 0);
  
  console.log('\n===== TASK STATISTICS =====');
  console.log(`Wallet: ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`);
  console.log(`Total Tasks: ${totalTasks}`);
  console.log(`Completed Tasks: ${completedTasks}`);
  console.log(`Claimed Tasks: ${claimedTasks}`);
  console.log(`Total XP Rewarded: ${totalXP}`);
  console.log('===========================\n');
}

async function processAccount(account, proxy = null, referalCode) {
  const { walletAddress, token } = account;
  
  console.log(`\n==== Processing account: ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)} ====`);
  if (proxy) {
    console.log(`Using proxy: ${proxy}`);
  }
  
  const apiClient = createApiClient(token, proxy);

  await registerWallet(apiClient, walletAddress, referalCode);
  await markeThirdEvent(walletAddress, proxy);


  let allTasks = [];
  
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      allTasks = await fetchTasks(apiClient, walletAddress);
      break;
    } catch (error) {
      retryCount++;
      console.error(`Error fetching tasks (attempt ${retryCount}/${maxRetries}):`, error.message);

      if (retryCount < maxRetries) {
        console.log(`Waiting 10 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        console.error(`Failed to fetch tasks after ${maxRetries} attempts. Skipping this account.`);
        return;
      }
    }
  }
  
  if (allTasks.length === 0) {
    console.log('No tasks found to process for this account');
    return;
  }
  
  console.log('\nInitial status:');
  displayStats(allTasks, walletAddress);
  
  await processTasksWithDelay(apiClient, walletAddress, allTasks);
  
  const updatedTasks = await fetchTasks(apiClient, walletAddress);
  
  console.log('\nFinal status:');
  displayStats(updatedTasks, walletAddress);
}

async function registerWallet(apiClient, walletAddress, referredCode) {
  try {
    const response = await apiClient.post('/users', {
      walletAddress: walletAddress,
      referredCode,
    }, {
      headers: {
        'Connection': 'keep-alive',
        'sec-ch-ua-platform': '"macOS"',
        'sec-ch-ua-mobile': '?0',
      }
    });

    console.log(`✅ Wallet ${walletAddress} 注册成功`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error registering wallet:`, error.response?.data || error.message);
    return null;
  }
}

async function markeThirdEvent(walletAddress, proxy = null) {
  try {
    const config = {
      headers: {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'content-type': 'text/plain;charset=UTF-8',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'x-client-id': '79698597d0e934426b15822da694bd31',
        'x-sdk-name': 'unified-sdk',
        'x-sdk-os': 'mac',
        'x-sdk-platform': 'browser',
        'x-sdk-version': '5.88.7',
        'origin': 'https://bydata.app',
        'referer': 'https://bydata.app/',
      },
      timeout: 30000,
      httpsAgent: createProxyAgent(proxy),
      proxy: false
    };

    const response = await axios.post('https://c.thirdweb.com/event', 
      JSON.stringify({
        source: "connectWallet",
        action: "connect",
        walletType: "com.okex.wallet",
        walletAddress: walletAddress,
        chainId: 1
      }), 
      config
    );

    console.log(`✅ Thirdweb event reported successfully for ${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending thirdweb event:`, error.response?.data || error.message);
    return null;
  }
}

async function main() {
  try {
    displayBanner();
    
    const accounts = await readConfig();
    const proxies = await readProxies();

    const referredCode = 'TIYN18WW'
    
    if (accounts.length === 0) {
      console.error('No valid accounts found in config file');
      return;
    }
    
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const proxy = proxies.length > 0 ? proxies[i % proxies.length] : null;
      
      try {
        await processAccount(account, proxy, referredCode);
      } catch (error) {
        console.error(`Error processing account ${account.walletAddress.substring(0, 6)}...: ${error.message}`);
        console.log('Continuing with next account...');
      }
      
      if (i < accounts.length - 1) {
        console.log('\nWaiting 5 seconds before processing next account...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('\n✅ All accounts processed successfully!');
    
  } catch (error) {
    console.error('Error in main process:', error.message);
  }
}

// 原文件最后几行改为：
if (require.main === module) {
  main();
}

module.exports = {
  createApiClient,
  registerWallet,
}
