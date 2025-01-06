void (async function () {
  window.ytoz = function (str) {
    return atob(str);
  };
  window.ztoy = function (str) {
    return btoa(str);
  };
  const BACKUP_INTERVAL = 6 * 60 * 60 * 1000; // 1小时，以毫秒为单位
  // 配置阿里云 OSS
  const client = new OSS({
    region: atob("b3NzLWNuLXd1aGFuLWxy"),
    accessKeyId: atob("TFRBSTV0UjFZSlJHRU1pWUJENGUybVp4"),
    accessKeySecret: atob("Y1g5U3lhamRwVW9nejBsRklxTENRelJPMFlUNE4x"),
    bucket: atob("eWFvaHVvLWJhY2t1cA=="),
  });

  // 工具函数：检查用户权限
  async function checkUserPermission(userId, type = "user") {
    try {
      const result = await client.get(`/config/${type}.json`);
      const userConfig = JSON.parse(result.content.toString());

      const user = userConfig.find((u) => u.id === userId);
      if (!user) {
        console.log("用户未配置权限");
        return false;
      }

      const now = new Date();
      if (new Date(user.date) < now) {
        console.log("用户权限已过期");
        return false;
      }

      return true;
    } catch (err) {
      console.error("获取用户配置信息失败:", err);
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

  async function backupData(userId, data) {
    const hasPermission = await checkUserPermission(userId);
    if (!hasPermission) {
      console.log("用户没有权限进行备份操作");
      return;
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
        console.info("now", now, lastBackupTime);
        if (timeDiff < BACKUP_INTERVAL) {
          console.log("距离上次备份不足6小时，跳过备份旧数据");
        } else {
          // 备份旧数据
          const backupKey = `backup/${userId}-${Date.now()}.json`;
          try {
            await client.head(currentFile);
            await client.copy(backupKey, currentFile);
            console.log(`备份旧数据到: ${backupKey}`);
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
          console.log(`首次备份旧数据到: ${backupKey}`);
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
      console.log(`备份当前数据到: ${currentFile}`);

      // 更新上次备份时间
      const lastBackupData = { lastBackupTime: now.toISOString() };
      await client.put(
        lastBackupKey,
        new Blob([JSON.stringify(lastBackupData)], { type: "application/json" })
      );
      console.log(`更新上次备份时间到: ${lastBackupKey}`);
    } catch (err) {
      console.error("备份数据失败:", err);
    }
  }

  // 恢复数据
  async function restoreData(userId) {
    const hasPermission = await checkUserPermission(userId);
    if (!hasPermission) {
      console.log("用户没有权限进行恢复操作");
      return;
    }

    try {
      const fileKey = `data/${userId}.json`;
      const result = await client.get(fileKey);

      const data = JSON.parse(result.content.toString());
      console.log(`恢复数据成功:`, data);
      return data;
    } catch (err) {
      console.error("恢复数据失败:", err);
    }
  }

  const YaoHuoUtils2 = {
    check: checkUserPermission,
    backupData,
    restoreData,
    client,
  };

  window.YaoHuoUtils2 = YaoHuoUtils2;

  // 测试用例
  // (async () => {
  //   const userId = "test-user-id";

  //   // 模拟数据
  //   const newData = {
  //     id: userId,
  //     name: "Test User",
  //     timestamp: new Date().toISOString(),
  //   };

  //   // 备份数据
  //   await backupData(userId, newData);

  //   // 恢复数据
  //   const restoredData = await restoreData(userId);
  //   console.log("恢复的数据:", restoredData);
  // })();
})();
