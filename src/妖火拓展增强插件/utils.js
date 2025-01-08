void (async function () {
  window.ytoz = function (str) {
    let newStr = atob(str);
    try {
      return JSON.parse(newStr);
    } catch (e) {
      return newStr;
    }
  };
  window.ztoy = function (str) {
    if (typeof str === "object") {
      str = JSON.stringify(str);
    }
    return btoa(str);
  };
  const selectedProperties = [
    "yaohuo_userData",
    "lastRemoteRestoreTime",
    "lastRemoteBackupTime",
    "yaohuoUserID",
    "boastData",
    "yaohuoLoginInfo",
    "autoEatList",
    "customLayoutEnabled",
    "myBoastHistoryHref",
    "notAutoEatBoastList",
    "draft_title",
    "draft_content",
    "customLayoutEnabled",
    "boastPlayGameObject",
    "winIdData",
    "currentLatestId",
    "nextMoney",
    "publishNumber",
  ];
  const BACKUP_INTERVAL = 6; // 1小时，以毫秒为单位
  const USER_INFO_KEY = "USER_INFO_KEY";
  // 配置阿里云 OSS
  const client = new OSS({
    region: ytoz("b3NzLWNuLXd1aGFuLWxy"),
    accessKeyId: ytoz("TFRBSTV0UjFZSlJHRU1pWUJENGUybVp4"),
    accessKeySecret: ytoz("Y1g5U3lhamRwVW9nejBsRklxTENRelJPMFlUNE4x"),
    bucket: ytoz("eWFvaHVvLWJhY2t1cA=="),
  });

  // 动态生成 AES-GCM 密钥
  async function generateAESKey() {
    return crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 }, // 256 位密钥
      true,
      ["encrypt", "decrypt"]
    );
  }

  // 导出密钥为 Base64
  async function exportKeyToBase64(key) {
    const rawKey = await crypto.subtle.exportKey("raw", key); // 导出为原始字节
    return btoa(String.fromCharCode(...new Uint8Array(rawKey))); // 转为 Base64 字符串
  }

  // 从 Base64 导入密钥
  async function importKeyFromBase64(base64Key) {
    const rawKey = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0)); // 转换为字节数组
    return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, true, [
      "encrypt",
      "decrypt",
    ]);
  }

  // 加密函数
  async function encryptData(data) {
    // 获取或创建 secretKey
    let secretKeyBase64 = sessionStorage.getItem(USER_INFO_KEY);
    let secretKey;

    if (!secretKeyBase64) {
      // 如果不存在密钥，则生成新密钥并存储到 sessionStorage
      secretKey = await generateAESKey();
      secretKeyBase64 = await exportKeyToBase64(secretKey);
      sessionStorage.setItem(USER_INFO_KEY, secretKeyBase64);
    } else {
      // 如果存在密钥，从 Base64 导入密钥
      secretKey = await importKeyFromBase64(secretKeyBase64);
    }

    // 初始化向量（IV）
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 加密数据
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const cipherText = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      secretKey,
      encodedData
    );

    // 返回加密数据和 IV
    return {
      cipherText: btoa(String.fromCharCode(...new Uint8Array(cipherText))), // 加密数据转为 Base64
      iv: btoa(String.fromCharCode(...iv)), // IV 转为 Base64
    };
  }

  // 解密函数
  async function decryptData(encrypted) {
    // 从 sessionStorage 获取 secretKey
    const secretKeyBase64 = sessionStorage.getItem(USER_INFO_KEY);

    if (!secretKeyBase64) {
      throw new Error("解析数据失败！");
    }

    // 从 Base64 导入密钥
    const secretKey = await importKeyFromBase64(secretKeyBase64);

    // 解密数据
    const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0)); // Base64 转字节
    const cipherText = Uint8Array.from(atob(encrypted.cipherText), (c) =>
      c.charCodeAt(0)
    ); // Base64 转字节

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      secretKey,
      cipherText
    );

    // 解码并返回解密后的数据
    return JSON.parse(new TextDecoder().decode(decryptedBuffer));
  }

  // 工具函数：记录日志
  async function logOperation(userId, operationType) {
    try {
      const logKey = `/log/${userId}.json`;

      // 获取当前时间和用户信息
      const now = new Date().toLocaleString();
      const userAgent = navigator.userAgent;
      const newLog = {
        userId,
        operationType,
        time: now,
        userAgent,
        url: location.href,
      };

      // 读取现有日志文件
      let existingLogs = [];
      try {
        const result = await client.get(logKey);
        existingLogs = ytoz(JSON.parse(result.content.toString()));
        existingLogs = existingLogs.slice(-200);
      } catch (err) {
        // console.log("日志文件不存在，将创建新的日志文件", err);
      }

      // 追加新日志
      existingLogs.push(newLog);

      // 上传更新后的日志文件
      await client.put(
        logKey,
        new Blob([JSON.stringify(ztoy(existingLogs))], {
          type: "application/json",
        })
      );
    } catch (err) {
      console.error("日志记录失败:", err);
    }
  }

  async function getCloudSyncTip() {
    let config = getSession("userConfig", {});
    let userId = getItem("yaohuoUserID", "");
    let cloudSyncTip = "：已过期";
    if (config && config.cipherText) {
      const userConfig = await decryptData(config);
      const user = userConfig.find((u) => Number(u.id) === Number(userId));
      if (user) {
        let date = user?.backup;
        cloudSyncTip =
          new Date(date) > new Date("2099-1-1")
            ? ` ：长期有效`
            : ` ：${date}过期`;
      }
    }
    return `<b>${cloudSyncTip}</b>`;
  }

  async function checkPermission(userId, type = "backup") {
    try {
      if (!userId) {
        return false;
      }
      const key = "userConfig";
      let text = type === "backup" ? "备份" : type === "user" ? "用户" : type;
      let userConfig = [];

      let config = getSession(key, {});
      let searchType = "";
      if (config && config.cipherText) {
        const decryptedData = await decryptData(config);
        userConfig = decryptedData;
        searchType = "1";
      } else {
        const result = await client.get(`/config/config.json`);
        userConfig = ytoz(result.content.toString());
        let cur = userConfig.filter((item) => item.id == userId);
        const encryptedData = await encryptData(cur);
        setSession(key, encryptedData);
        searchType = "2";
      }

      const user = userConfig.find((u) => Number(u.id) === Number(userId));
      if (!user) {
        console.log("请联系开发者");
        await logOperation(userId, `${type}_rejected`);
        return false;
      }

      const now = new Date();
      if (!user[type] || new Date(user[type]) < now) {
        console.log("请联系开发者");
        await logOperation(userId, `${type}_timeout`);
        return false;
      }

      if (searchType === "2") {
        await logOperation(userId, `${type}_success`);
      }

      return true;
    } catch (err) {
      console.error("请联系开发者:", err);
      await logOperation(userId, `${type}_error`);
      return false;
    }
  }

  // 工具函数：清理旧备份文件（最多保留5个备份）
  async function cleanOldBackups(userId) {
    try {
      const files = await client.list({
        prefix: `backup/${userId}-`,
      });

      if (files.objects && files.objects.length > 5) {
        const sortedFiles = files.objects.sort(
          (a, b) => new Date(a.lastModified) - new Date(b.lastModified)
        );
        const filesToDelete = sortedFiles.slice(0, sortedFiles.length - 5);

        for (const file of filesToDelete) {
          await client.delete(file.name);
          console.log(`删除旧备份文件: ${file.name}`);
        }
      }
    } catch (err) {
      console.error("清理旧备份文件失败:", err);
    }
  }

  function closeSync() {
    let isOpenCloudSync = yaohuo_userData?.isOpenCloudSync;
    if (isOpenCloudSync) {
      yaohuo_userData.isOpenCloudSync = false;
      setItem("yaohuo_userData", yaohuo_userData);
    }
  }

  async function uploadJson(data) {
    let userId = getItem("yaohuoUserID", "");
    const hasPermission = await checkPermission(userId);
    if (!hasPermission) {
      console.log("请联系开发者");
      closeSync();
      return "备份数据失败，请联系开发者";
    }

    try {
      const currentFile = `data/${userId}.json`;
      const lastBackupKey = `data/${userId}-lastBackup.json`;
      const now = new Date();

      // 检查上次备份时间
      let lastBackupTime = null;
      try {
        const result = await client.get(lastBackupKey);
        lastBackupTime = new Date(JSON.parse(result.content).lastBackupTime);
      } catch (err) {
        console.log("未找到上次备份时间记录，将首次进行备份");
      }

      // 判断是否需要备份旧数据
      if (lastBackupTime) {
        const timeDiff = now - lastBackupTime;
        if (timeDiff < BACKUP_INTERVAL * 60 * 60 * 1000) {
          console.log(`距离上次备份不足${BACKUP_INTERVAL}小时，跳过备份旧数据`);
        } else {
          // 备份旧数据
          const backupKey = `backup/${userId}-${Date.now()}.json`;
          try {
            await client.head(currentFile);
            await client.copy(backupKey, currentFile);
            console.log(`备份旧数据成功`);
          } catch (err) {
            console.log("没有发现旧数据，无需备份");
          }

          // 清理多余的备份
          await cleanOldBackups(userId);
        }
      } else {
        // 如果没有上次备份时间，直接备份一次旧数据
        const backupKey = `backup/${userId}-${Date.now()}.json`;
        try {
          await client.head(currentFile);
          await client.copy(backupKey, currentFile);
          console.log(`首次备份旧数据成功`);
        } catch (err) {
          console.log("没有发现旧数据，无需备份");
        }

        // 清理多余的备份
        await cleanOldBackups(userId);
      }

      // 上传新数据
      await client.put(
        currentFile,
        new Blob([JSON.stringify(data)], { type: "application/json" })
      );
      // console.log(`备份当前数据到: ${currentFile}`);

      // 更新上次备份时间
      const lastBackupData = { lastBackupTime: now.toISOString() };
      await client.put(
        lastBackupKey,
        new Blob([JSON.stringify(lastBackupData)], { type: "application/json" })
      );
      // console.log(`更新上次备份时间到: ${lastBackupKey}`);
    } catch (err) {
      console.error("备份数据失败:", err);
      return "备份数据失败，请联系开发者";
    }

    return "备份数据成功";
  }

  // 恢复数据
  async function downloadJson(forceRevert) {
    let userId = getItem("yaohuoUserID", "");
    const hasPermission = await checkPermission(userId);
    if (!hasPermission) {
      console.log("请联系开发者");
      closeSync();
      return "恢复数据失败、请联系开发者";
    }

    try {
      const fileKey = `data/${userId}.json`;
      const result = await client.get(fileKey);

      let dateStr = result.res.headers["last-modified"];
      let lastRemoteBackupTime = getItem("lastRemoteBackupTime", 0);
      let lastRemoteRestoreTime = getItem("lastRemoteRestoreTime", 0);
      let modifyTime = new Date(dateStr).getTime();
      // console.info("utils-last-modified", new Date(dateStr).toLocaleString());
      // console.info(
      //   "utils-lastRemoteBackupTime",
      //   new Date(lastRemoteBackupTime).toLocaleString()
      // );
      // console.info(
      //   "utils-lastRemoteRestoreTime",
      //   new Date(lastRemoteRestoreTime).toLocaleString()
      // );
      // const data = JSON.parse(result.content.toString());

      if (modifyTime > lastRemoteRestoreTime || forceRevert) {
        console.info("utils--------开始远程数据恢复-------");
        restoreData(result.content.toString());
      } else {
        setItem("lastRemoteRestoreTime", new Date().getTime());
        console.info("utils-文件修改时间小于上次远程恢复时间，取消恢复");
      }
      // return data;
    } catch (err) {
      console.error("恢复数据失败:", err);
      return "恢复数据失败，请联系开发者";
    }
    return "恢复数据成功";
  }

  function getSelectedDataFromLocalStorage(selectedProperties) {
    var selectedData = {};

    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);

      if (!selectedProperties || selectedProperties.includes(key)) {
        var value = localStorage.getItem(key);
        if (key === "yaohuo_userData") {
          let obj = JSON.parse(value);
          delete obj.websitePassword;
          value = JSON.stringify(obj);
        }
        selectedData[key] = value;
      }
    }

    // 返回包含所选属性的对象
    return selectedData;
  }

  function restoreData(userInput) {
    if (userInput !== null && userInput.trim() !== "") {
      try {
        // 解析 JSON 字符串并将数据写入 localStorage
        var parsedData = JSON.parse(userInput);
        if (typeof parsedData === "object" && parsedData !== null) {
          let newData = getItem("yaohuo_userData");

          localStorage.clear();

          for (var key in parsedData) {
            if (parsedData.hasOwnProperty(key)) {
              if (key === "yaohuo_userData") {
                let oldData = JSON.parse(parsedData[key]);
                for (const oldKey in oldData) {
                  if (oldData.hasOwnProperty(oldKey)) {
                    newData[oldKey] = oldData[oldKey];
                  }
                }
                yaohuo_userData = newData;
                setItem("yaohuo_userData", yaohuo_userData);
              } else {
                if (selectedProperties.includes(key)) {
                  setItem(key, parsedData[key]);
                }
              }
            }
          }

          setItem("lastRemoteRestoreTime", new Date().getTime());

          // alert("数据已还原");
          setTimeout(() => {
            window.location.reload();
          }, 300);
        } else {
          alert("无效的数据格式。请确保粘贴有效的数据格式。");
        }
      } catch (err) {
        alert("还原数据时出错。请确保粘贴有效的数据格式。");
        console.error("Error restoring localStorage data", err);
      }
    } else {
      alert("没有粘贴任何数据。请确保粘贴有效的数据格式。");
    }
  }

  function getLoginStatus() {
    let yaohuoLoginInfo = getItem("yaohuoLoginInfo", {});
    return (
      (new Date().getTime() - yaohuoLoginInfo.timestamp) / 1000 < 60 * 60 * 6 &&
      ytoz(yaohuoLoginInfo.token || "") == getItem("yaohuoUserID", "")
    );
  }

  async function getInfo() {
    let userId = getItem("yaohuoUserID", "");
    if (getLoginStatus() && (await checkPermission(userId, "user"))) {
      return;
    }

    let id = await getUserId(undefined, true);

    try {
      let flag = await checkPermission(id, "user");

      let data = {
        token: flag ? ztoy(id) : null,
        timestamp: new Date().getTime(),
      };

      setItem("yaohuoLoginInfo", data, true);
      setItem("notAutoEatBoastList", []);
      if (!flag) {
        setItem = () => {};
        getItem = () => ({});
        MY_addStyle = () => {};
        MY_setValue = () => {};
        MY_getValue = () => ({});
      }
      
    } catch (err) {
      console.info(err);
      throw new Error("加载失败");
    }
  }

  async function init() {
    await getInfo();
  }

  const YaoHuoUtils = {
    checkUser: (userId) => checkPermission(userId, "user"),
    checkBackup: (userId) => checkPermission(userId, "backup"),
    setData: () => {
      let jsonData = getSelectedDataFromLocalStorage(selectedProperties);
      return uploadJson(jsonData);
    },
    getData: (forceRevert = false) => {
      return downloadJson(forceRevert);
    },
    getCloudSyncTip: getCloudSyncTip,
    init: init,
  };
  window.getLoginStatus = getLoginStatus;
  window.YaoHuoUtils = YaoHuoUtils;
})();
