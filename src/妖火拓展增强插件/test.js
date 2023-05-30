fetch("./吹牛数据.json")
  .then((response) => response.json())
  .then((data) => {
    // 在这里处理JSON数据
    console.log(data); // 输出到控制台
    // document.getElementById('result').innerText = JSON.stringify(data); // 将数据显示在页面上
  })
  .catch((error) => {
    console.error("Error:", error);
  });
