void (async function () {
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
                setItem(key, parsedData[key]);
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

  // 上传 JSON 文件
  async function uploadJson(fileName, jsonData) {
    try {
      // 将 JSON 对象转换为字符串
      const jsonString = JSON.stringify(jsonData);
      const options = {
        meta: { temp: "demo" },
        mime: "json",
        headers: { "Content-Type": "text/plain" },
      };
      // 将字符串转换为 Blob
      const blob = new Blob([jsonString], { type: "application/json" });
      // 上传文件
      const result = await client.put(fileName, blob);
      console.log("utils-File uploaded:", result.name);
    } catch (err) {
      console.error("utils-Error uploading file:", err);
    }
  }

  // 下载 JSON 文件
  async function downloadJson(fileName, forceRevert) {
    try {
      const result = await client.get(fileName);

      let dateStr = result.res.headers["last-modified"];
      let lastRemoteBackupTime = getItem("lastRemoteBackupTime", 0);
      let lastRemoteRestoreTime = getItem("lastRemoteRestoreTime", 0);
      let modifyTime = new Date(dateStr).getTime();
      console.info("utils-last-modified", new Date(dateStr).toLocaleString());
      console.info(
        "utils-lastRemoteBackupTime",
        new Date(lastRemoteBackupTime).toLocaleString()
      );
      console.info(
        "utils-lastRemoteRestoreTime",
        new Date(lastRemoteRestoreTime).toLocaleString()
      );
      if (modifyTime > lastRemoteRestoreTime || forceRevert) {
        console.info("utils--------开始远程数据恢复-------");
        restoreData(result.content.toString());
      } else {
        console.info("utils-文件修改时间小于上次远程恢复时间，取消恢复");
      }
    } catch (err) {
      console.error("utils-Error downloading file:", err);
    }
  }
  function utilsInit() {
    client = new OSS({
      region: atob("b3NzLWNuLXd1aGFuLWxy"),
      accessKeyId: atob("TFRBSTV0UjFZSlJHRU1pWUJENGUybVp4"),
      accessKeySecret: atob("Y1g5U3lhamRwVW9nejBsRklxTENRelJPMFlUNE4x"),
      bucket: atob("eWFvaHVvLWJhY2t1cA=="),
    });

    let UserID = getItem("yaohuoUserID", "");
    fileName = `${UserID}.json`;
  }
  let client;
  let fileName;
  const YaoHuoUtils = {
    init: utilsInit,
    setData: (forceRevert) => {
      utilsInit();
      let jsonData = getSelectedDataFromLocalStorage();
      uploadJson(fileName, jsonData);
    },
    getData: (forceRevert) => {
      utilsInit();
      downloadJson(fileName, forceRevert);
    },
  };

  window.YaoHuoUtils = YaoHuoUtils;
})();
