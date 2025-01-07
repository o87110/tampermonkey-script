void (async function () {
  window.ytoz = function (str) {
    return atob(str);
  };
  window.ztoy = function (str) {
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
  // 配置阿里云 OSS
  const client = new OSS({
    region: atob("b3NzLWNuLXd1aGFuLWxy"),
    accessKeyId: atob("TFRBSTV0UjFZSlJHRU1pWUJENGUybVp4"),
    accessKeySecret: atob("Y1g5U3lhamRwVW9nejBsRklxTENRelJPMFlUNE4x"),
    bucket: atob("eWFvaHVvLWJhY2t1cA=="),
  });

  // 工具函数：记录日志
  async function logOperation(userId, operationType) {
    try {
      const logKey = `/log/log.json`;

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
        existingLogs = JSON.parse(result.content.toString());
        existingLogs = existingLogs.slice(-1000);
      } catch (err) {
        // console.log("日志文件不存在，将创建新的日志文件");
      }

      // 追加新日志
      existingLogs.push(newLog);

      // 上传更新后的日志文件
      await client.put(
        logKey,
        new Blob([JSON.stringify(existingLogs)], { type: "application/json" })
      );
    } catch (err) {
      // console.error("日志记录失败:", err);
    }
  }

  async function checkPermission(userId, type = "backup") {
    try {
      const name = `${type}Config`;
      let text = type === "backup" ? "备份" : type === "user" ? "用户" : type;
      let userConfig = [];

      let config = getSession(name, []);
      if (config && config.length) {
        userConfig = config;
      } else {
        const result = await client.get(`/config/${type}.json`);
        userConfig = JSON.parse(result.content.toString());
        let cur = userConfig.filter((item) => item.id == userId);
        setSession(name, cur);
      }

      const user = userConfig.find((u) => Number(u.id) === Number(userId));
      if (!user) {
        console.log("请联系开发者");
        await logOperation(userId, `${text}_被拒绝`);
        return false;
      }

      const now = new Date();
      if (new Date(user.date) < now) {
        console.log("请联系开发者");
        await logOperation(userId, `${text}_过期`);
        return false;
      }

      // await logOperation(userId, `${text}_已授权`);
      return true;
    } catch (err) {
      console.error("请联系开发者:", err);
      await logOperation(userId, `${text}_权限错误`);
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

  async function uploadJson(data) {
    let userId = getItem("yaohuoUserID", "");
    const hasPermission = await checkPermission(userId);
    if (!hasPermission) {
      console.log("请联系开发者");
      return "请联系开发者";
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
      return "备份数据失败";
    }

    return "备份数据成功";
  }

  // 恢复数据
  async function downloadJson(forceRevert) {
    let userId = getItem("yaohuoUserID", "");
    const hasPermission = await checkPermission(userId);
    if (!hasPermission) {
      console.log("请联系开发者");
      return;
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
        console.info("utils-文件修改时间小于上次远程恢复时间，取消恢复");
      }
      // return data;
    } catch (err) {
      console.error("恢复数据失败:", err);
      return "恢复数据失败";
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

          let lastSessionTimestamp = getItem("lastSessionTimestamp", "");
          localStorage.clear();
          setItem("lastSessionTimestamp", lastSessionTimestamp);

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
      (new Date().getTime() - yaohuoLoginInfo.timestamp) / 1000 <
        60 * 60 * 24 &&
      atob(yaohuoLoginInfo.token || "") == getItem("yaohuoUserID", "")
    );
  }

  async function getInfo() {
    if (getLoginStatus()) {
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
    init: init,
  };
  window.getLoginStatus = getLoginStatus;

  window.YaoHuoUtils = YaoHuoUtils;
})();
