void (async function () {
  // 加密密钥和初始化向量长度（必须与后端保持一致）
  const ENCRYPTION_KEY =
    "a79eb3beb3ff0fe51442cc9ba8dd2732f60fdb8a4228cac9a888993ef915f764";
  const IV_LENGTH = 16;

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
  async function uploadJson(data) {
    return new Promise((resolve, reject) => {
      try {
        let userid = getItem("yaohuoUserID", "");

        fetch("https://yhwapi.52it.top/set", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userid, data }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("api-File uploaded:", new Date().toLocaleString());
            resolve("备份数据成功");
          })
          .catch((error) => {
            console.error("Error:", error);
            reject("备份数据失败");
          });
      } catch (err) {
        console.error("api-Error uploading file:", err);
        reject("备份数据失败");
      }
    });
  }

  // 下载 JSON 文件
  async function downloadJson(forceRevert) {
    return new Promise((resolve, reject) => {
      try {
        let userId = getItem("yaohuoUserID", "");

        fetch(`https://yhwapi.52it.top/get/${userId}`)
          .then((response) => response.json())
          .then((res) => {
            if (res.code === 0) {
              let dateStr = res.data.lastModified;
              decrypt(res.data.content)
                .then((decryptedData) => {
                  let decryptedObj = JSON.parse(decryptedData);
                  let lastRemoteBackupTime = getItem("lastRemoteBackupTime", 0);
                  let lastRemoteRestoreTime = getItem(
                    "lastRemoteRestoreTime",
                    0
                  );
                  let modifyTime = new Date(dateStr).getTime();

                  if (modifyTime > lastRemoteRestoreTime || forceRevert) {
                    console.info("api--------开始远程数据恢复-------");
                    restoreData(decryptedData);
                    resolve("恢复数据成功");
                  } else {
                    console.info(
                      "api-文件修改时间小于上次远程恢复时间，取消恢复"
                    );
                  }
                })
                .catch((error) => {
                  console.error("Decryption Error:", error);
                  reject("恢复数据失败");
                });
            } else {
              console.info(res.message);
              reject("恢复数据失败");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            reject("恢复数据失败");
          });
      } catch (err) {
        console.error("api-Error downloading file:", err);
        reject("恢复数据失败");
      }
    });
  }

  function hexToUint8Array(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
  }

  async function decrypt(encrypted) {
    const [ivHex, encryptedHex] = encrypted.split(":");
    const iv = hexToUint8Array(ivHex);
    const encryptedData = hexToUint8Array(encryptedHex);
    const key = hexToUint8Array(ENCRYPTION_KEY);

    const importedKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-CBC", length: 256 },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: iv },
      importedKey,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  }

  const YaoHuoUtils = {
    setData: (forceRevert) => {
      let jsonData = getSelectedDataFromLocalStorage();
      return uploadJson(jsonData);
    },
    getData: (forceRevert) => {
      return downloadJson(forceRevert);
    },
  };

  window.YaoHuoUtils = YaoHuoUtils;
})();
