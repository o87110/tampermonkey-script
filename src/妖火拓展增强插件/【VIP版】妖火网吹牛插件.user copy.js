// ==UserScript==
// @name         【VIP版】妖火网吹牛插件
// @namespace    https://yaohuo.me/
// @version      1.1.5
// @description  吹牛插件
// @author       龙少c(id:20469)开发
// @match        *://yaohuo.me/*
// @match        *://*.yaohuo.me/*
// @icon         https://yaohuo.me/css/favicon.ico
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";
  // 实现简易版替换用到的jquery，全部换成原生js太麻烦
  let $, jQuery;
  $ = jQuery = myJquery();

  // 设置密码，玩吹牛时隔段时间会要求输密码，填入可自动输入密码并确认
  let websitePassword = "";

  // 是否是自动吃牛：true为是：false为否
  let isAutoEatBoast = false;

  // 赌注妖精大于则不自动吃
  let eatBoastMaxNum = 500;

  // 自身妖精小于则不自动吃
  let eatBoastMaxMoney = 100000;

  // 批量发牛金额，
  let batchPublishBoastMoney = 500;

  // 发吹牛答案1的概率，如果设置0.6代表60%选1,40%选2
  let publishAnswer1Rate = 0.5;

  // 吃吹牛答案1的概率，如果设置0.6代表60%选1,40%选2
  let eatAnswer1Rate = 0.5;

  // 统计指定页数据按钮 查询指定页数或者id方式：1简略，2详细
  // 推荐使用1速度更快，主要查输赢了多少妖精
  // 使用方式：填写页数或者截止的id，比如填8则从当前页开始查询8页的数据
  // 如果填写id，比如统计今日妖精变动，去我的大话里面找到今天第一条发妖精的id比如填890717
  // 会统计最近的到这条id的记录，吃牛也是同样的可以统计，统计别人的同理
  let searchBoastLogType = 1;

  // 是否自动发吹牛：true为是：false为否
  let isAutoPublishBoast = false;

  // 发牛最大连续次数：如1111则为连续4次，设置4则第5次必为2，不建议设置过小，也不建议设置过大
  let publishBoastMaxConsecutive = 8;

  // 自动发牛的时间间隔 无需修改，会根据是否有人吃牛动态调整时间
  let autoPublishBoastInterval = MY_getValue("autoPublishBoastInterval", 30);

  // 自动发布吹牛策略：1、2；本金少（几十万）推荐用策略1，本金多（几百万几千万）推荐策略2
  // 1为加法策略，下一次金额为最近两次之和，例如：500, 1000, 1500, 2500, 4000, 6500, 10500
  // 2为乘积策略，下一次金额为上一次的两倍，例如：500, 1000, 1500, 3000, 6000, 12000, 24000
  let autoPublishBoastStrategy = 1;

  // 自动发牛初始值，默认500，不建议初始值过高：可设置500,1000,1500,2000等等
  let autoPublishBoastInitialValue = 500;

  // 发牛手续费次数；上一把输了下一把则加上手续费，赢了则不加，0代表不计算手续费，10代表10把内计算手续费，如果想要每次输了下一把都计算手续费填个很大的数字就行，比如20
  let addCommissionCount = 0;

  // 策略2倍数，代表从第二把开始的倍数，往后依次增加可以自定义修改，可以增加倍数比如：[3, 2.8, 2.6, 2.4, 2.2]等等，如果后续没写的话默认就用下面的后续默认倍数
  let multiplyRate = [3, 2.5, 2.1, 2];
  // 策略2后续默认倍数: 2,如果只设置了 [3, 2.5, 2.1, 2]，那么后续都是2倍，相当于 [3, 2.5, 2.1, 2, 2, 2, 2.....]
  let strategy2DefaultRate = 2;
  /* 
    策略1：加法策略，下一次金额为最近两次之和；不同初始值，连输后下一把对应的赌注: 
    (500初始值)  [500, 1000, 1500, 2500, 4000, 6500, 10500, 17000, 27500, 44500]
    (1000初始值) [1000, 2000, 3000, 5000, 8000, 13000, 21000, 34000, 55000, 89000]
    (1500初始值) [1500, 2250, 3750, 6000, 9750, 15750, 25500, 41250, 66750, 108000]
    (2000初始值) [2000, 3000, 5000, 8000, 13000, 21000, 34000, 55000, 89000, 144000]
    (2500初始值) [2500, 3750, 6250, 10000, 16250, 26250, 42500, 68750, 111250, 180000]
    (3000初始值) [3000, 4500, 7500, 12000, 19500, 31500, 51000, 82500, 133500, 216000]
    (3500初始值) [3500, 5250, 8750, 14000, 22750, 36750, 59500, 96250, 155750, 252000]
    (4000初始值) [4000, 6000, 10000, 16000, 26000, 42000, 68000, 110000, 178000, 288000]
    (4500初始值) [4500, 6750, 11250, 18000, 29250, 47250, 76500, 123750, 200250, 324000]
  */
  /*
    策略2：乘积策略，下一次金额为上一次的两倍；不同初始值，连输后下一把对应的赌注: 
    (500初始值)  [500, 1000, 1500, 3000, 6000, 12000, 24000, 48000, 96000, 192000]
    (1000初始值) [1000, 2000, 3000, 6000, 12000, 24000, 48000, 96000, 192000, 384000]
    (1500初始值) [1500, 2250, 3750, 7500, 15000, 30000, 60000, 120000, 240000, 480000]
    (2000初始值) [2000, 3000, 5000, 10000, 20000, 40000, 80000, 160000, 320000, 640000]
    (2500初始值) [2500, 3750, 6250, 12500, 25000, 50000, 100000, 200000, 400000, 800000]
    (3000初始值) [3000, 4500, 7500, 15000, 30000, 60000, 120000, 240000, 480000, 960000]
    (3500初始值) [3500, 5250, 8750, 17500, 35000, 70000, 140000, 280000, 560000, 1120000]
    (4000初始值) [4000, 6000, 10000, 20000, 40000, 80000, 160000, 320000, 640000, 1280000]
    (4500初始值) [4500, 6750, 11250, 22500, 45000, 90000, 180000, 360000, 720000, 1440000]
  */

  // 定时器
  let timer = null;

  // ==主代码执行==
  (function () {
    // 自动填充密码并确认
    handlePassword();
    // 吹牛增强
    handleBoast();
  })();
  // ==其他功能函数和方法==
  // 填充密码
  function handlePassword() {
    let password = document.querySelector("input[type=password]");
    let submit = document.querySelector("input[type=submit]");
    if (document.title === "请输入密码") {
      if (!password.value) {
        password.value = websitePassword;
      }
      if (password.value) {
        submit.click();
      }
    }
  }
  /**
   * 生成指定范围内的随机整数
   * @param {number} min - 随机数范围的最小值
   * @param {number} max - 随机数范围的最大值
   * @returns {number} - 生成的随机整数
   */
  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  function getBoastRandomNum() {
    // 发牛答案 publishAnswer1Rate
    // 吃牛答案 eatAnswer1Rate
    return generateRandomNumber(publishAnswer1Rate, publishBoastMaxConsecutive);
  }
  /**
   *
   * @param {*} probability 概率
   * @param {*} maxConsecutive 最大连续数
   * @returns 返回生成后的随机数
   */
  function generateRandomNumber(probability, maxConsecutive) {
    let boastConfig = MY_getValue("boastConfig", {});
    let {
      previousNumber,
      consecutiveCount = 1,
      randomConsecutive,
      previousAry = [],
    } = boastConfig;

    let randomNumber = Math.random() < probability ? 1 : 2;
    if (!randomConsecutive) {
      randomConsecutive = getRandomNumber(2, maxConsecutive);
      boastConfig.randomConsecutive = randomConsecutive;
      MY_setValue("boastConfig", boastConfig);
    }
    if (consecutiveCount >= randomConsecutive) {
      randomNumber = previousNumber === 1 ? 2 : 1; // 切换到另一个数字
    }
    return randomNumber;
  }
  function saveBoastRandomNumber(randomNumber) {
    let boastConfig = MY_getValue("boastConfig", {});
    let {
      previousNumber,
      consecutiveCount,
      randomConsecutive,
      previousAry = [],
    } = boastConfig;

    if (randomNumber === previousNumber) {
      consecutiveCount++;
    } else {
      randomConsecutive = getRandomNumber(2, publishBoastMaxConsecutive);
      consecutiveCount = 1;
    }
    previousNumber = randomNumber;
    previousAry.push(randomNumber);

    boastConfig.previousNumber = previousNumber;
    boastConfig.randomConsecutive = randomConsecutive;
    boastConfig.consecutiveCount = consecutiveCount;
    boastConfig.previousAry = previousAry.slice(-10);
    MY_setValue("boastConfig", boastConfig);
    return randomNumber;
  }
  // 处理吹牛
  async function handleBoast() {
    let boastPage = [
      "/games/chuiniu/index.aspx",
      "/games/chuiniu/doit.aspx",
      "/games/chuiniu/add.aspx",
      "/games/chuiniu/book_list.aspx",
      "/games/chuiniu/book_view.aspx",
    ];
    if (!boastPage.includes(location.pathname)) {
      return;
    }

    MY_addStyle(`
      .boast-btn-style{
        color: #fff; 
        font-size: 14px; 
        background-color: #888888;
        border-radius: 5px;
        margin-left: 6px;
        padding: 5px 8px;
        cursor: pointer;
      }
      .boast-card-style{
        padding:5px; 
        margin: 5px; 
        background: #e5f3ee; 
        border-radius: 6px;
      }
    `);
    // 吹牛主页
    if ("/games/chuiniu/index.aspx".includes(location.pathname)) {
      // 添加查询吹牛数据
      handleAddSearch();

      let list = document.querySelectorAll(
        "a[href^='/games/chuiniu/doit.aspx']"
      );
      let money = document.querySelector(
        ".subtitle a[href^='/bbs/banklist.aspx']"
      );
      let publishBoastBtn = document.querySelector(
        "a[href^='/games/chuiniu/add.aspx']"
      );

      if (publishBoastBtn.innerText === "我要公开挑战") {
        // 添加批量按钮
        publishBoastBtn.insertAdjacentHTML(
          "afterend",
          `<input type="button" class="batch-publish-btn boast-btn-style" value='批量公开挑战'>`
        );
        $(".batch-publish-btn").click(() => {
          let number = prompt("请输入批量公开挑战的数量：");
          if (number && /^\d+$/.test(number)) {
            setItem("publishNumber", number - 1);
            let href = publishBoastBtn.href;
            let newHref = href.includes("?")
              ? `${href}&open=new`
              : `${href}?open=new`;
            location.href = newHref;
          } else if (number) {
            alert("输入的格式不对，只能是大于0的数字");
          }
        });
      }

      // 是否开启自动发牛
      if (isAutoPublishBoast) {
        let nextBoastData = await getMyBoastData();
        if (!timer) {
          autoPublishBoastInterval = nextBoastData.isFinished
            ? parseInt(autoPublishBoastInterval) - 25
            : parseInt(autoPublishBoastInterval) + 5;
          if (autoPublishBoastInterval <= 5) {
            autoPublishBoastInterval = 5;
          }
          if (autoPublishBoastInterval >= 50) {
            autoPublishBoastInterval = 50;
          }
          timer = setInterval(function () {
            location.reload();
          }, autoPublishBoastInterval * 1000);

          MY_setValue("autoPublishBoastInterval", autoPublishBoastInterval);
        }

        // 小于7点不发牛
        if (new Date().getHours() < 7 && nextBoastData.lastIsWin) {
          return;
        }
        if (nextBoastData.isFinished) {
          setItem("publishNumber", "0");

          let href = publishBoastBtn.href;
          let nextMoney = nextBoastData.nextMoney || 500;
          // setItem("nextMoney", nextMoney);
          let newHref = href.includes("?")
            ? `${href}&open=new&publishMoney=${nextMoney}`
            : `${href}?open=new&publishMoney=${nextMoney}`;
          // console.log("跳转到自动发肉页面", newHref);
          location.href = newHref;
        } else {
          console.log("当前未完成不发牛");
        }
      }
      // 是否开启自动吃牛
      if (isAutoEatBoast) {
        for (const item of list) {
          let match = item.innerHTML.match(/\((\d+)妖晶\)$/);
          let number = parseInt(match[1]);
          let href = item.getAttribute("href");

          let newHref = href.includes("?")
            ? `${href}&open=new`
            : `${href}?open=new`;
          if (money.innerText - number >= eatBoastMaxMoney) {
            if (number <= eatBoastMaxNum) {
              // item.click();
              location.href = newHref;
            } else {
              console.log(
                `当前大于设置的赌注妖精：${eatBoastMaxNum}，则不自动吃`
              );
            }
          }
        }
      }
    }

    // 吃吹牛页面
    if ("/games/chuiniu/doit.aspx".includes(location.pathname)) {
      let password = document.querySelector("input[type=password]");
      let submit = document.querySelector("input[type=submit]");
      let select = document.querySelector("select");
      let subTitle = document.querySelector(".subtitle");
      // 吃多吃2少吃1
      let answer1Rate = eatAnswer1Rate;
      let randomNum = Math.random() < answer1Rate ? 1 : 2;
      let isAutoEat = window.location.search.includes("open=new");
      if (document.title === "应战") {
        // 应战结果就返回
        if (!select) {
          location.href = "/games/chuiniu/index.aspx";
          return;
        }
        select.value = randomNum;
        if (subTitle) {
          subTitle.insertAdjacentHTML(
            "beforeend",
            `<input type="button" class="search-history-data boast-btn-style" value='查询历史数据'>`
          );
          subTitle.insertAdjacentHTML(
            "afterend",
            `<div class="subTitleTips boast-card-style">
            <span style="color:red">正在分析发牛者历史数据请等待，数据生成后会根据概率重新生成答案</span>
            </div>`
          );
          let spaceUrl = document.querySelector(
            "a[href^='/bbs/userinfo.aspx']"
          ).href;
          let userId = await getUserId(spaceUrl);
          let url = `/games/chuiniu/book_list.aspx?type=0&touserid=${userId}&siteid=1000&classid=0`;
          let res = await fetchData(url);
          let match = /<body>([\s\S]*?)<\/body>/.exec(res);
          let bodyString = match?.[0];
          if (bodyString) {
            let tempDiv = document.createElement("div");
            tempDiv.innerHTML = bodyString;
            let res = await handleData(tempDiv, true);
            tempDiv = null;
            let {
              total,
              tzSelect1,
              tzSelect2,
              tzSelect1Win,
              tzSelect2Win,
              tzWin,
              tzWinRate,
              yzSelect1,
              yzSelect2,
              yzSelect1Win,
              yzSelect2Win,
              tzSelectString,
              yzSelectString,
              tzSelectDomString,
              tzMoney,
              yzMoney,
            } = res;
            document.querySelector(".subTitleTips").innerHTML = `
              <p>发牛者过去${total}条中，选择了：${tzSelectDomString}，答案一：${tzSelect1}次，选择答案二：${tzSelect2}次</p>
              <p>选择1胜率：
              <b style="color:${tzSelect1 > tzSelect2 ? "red" : "unset"}">
              ${(tzSelect1 / total || 0).toFixed(2)}
              </b>
              ，选择2胜率：
              <b style="color:${tzSelect1 < tzSelect2 ? "red" : "unset"}">${(
              tzSelect2 / total || 0
            ).toFixed(2)}</b></p>
            <p>
              发吹牛<b style="color:${tzMoney >= 0 ? "red" : "green"}">${
              tzMoney > 0 ? "赢了" : "输了"
            }</b>${Math.abs(tzMoney)}妖精\n
              </p>
            `;

            answer1Rate = tzSelect1 / total;

            randomNum = Math.random() < answer1Rate ? 1 : 2;
            select.value = randomNum;
            console.log("生成答案1的概率：", answer1Rate);
          }
          $(".search-history-data").click(async () => {
            location.href = url;
          });
        }

        let payMoney = document
          .querySelector("form")
          ?.innerText.match(/赌注是 (\d+) 妖晶/)?.[1];
        if (isAutoEat && payMoney && payMoney <= eatBoastMaxNum) {
          submit.click();
        } else {
          console.log("非自动吃牛，不自动吃");
        }
        select.insertAdjacentHTML(
          "afterend",
          `<input type="button" class="random-number-btn boast-btn-style" value='随机生成答案'>`
        );
        $(".random-number-btn").click((e) => {
          randomNum = Math.random() < answer1Rate ? 1 : 2;
          select.value = randomNum;
        });
      } else if (document.title !== "请输入密码") {
        location.href = "/games/chuiniu/index.aspx";
      }
    }

    // 发布吹牛页面
    if ("/games/chuiniu/add.aspx".includes(location.pathname)) {
      let number = document.querySelector("input[type=number]");
      let submit = document.querySelector("input[type=submit]");
      let select = document.querySelector("select");
      let answer1Rate = publishAnswer1Rate;
      let randomNum = getBoastRandomNum();
      let isAutoEat = window.location.search.includes("open=new");

      if (document.title === "公开挑战") {
        if (select) {
          if (!isAutoEat) {
            setItem("publishNumber", "0");
          } else {
            let publishMoney = getUrlParameters().publishMoney;
            number.value = publishMoney || batchPublishBoastMoney || 500;
          }

          if (isAutoPublishBoast && !isAutoEat) {
            setTimeout(() => {
              location.href = "/games/chuiniu/index.aspx";
            }, 5000);
          }
          // 保存发布的值
          submit.addEventListener(
            "click",
            () => {
              saveBoastRandomNumber(randomNum);
            },
            true
          );

          select.value = randomNum;

          select.insertAdjacentHTML(
            "afterend",
            `<input type="button" class="random-number-btn boast-btn-style" value='随机生成答案'>`
          );

          $(".random-number-btn").click((e) => {
            // 发布多发2少发1
            randomNum = Math.random() < answer1Rate ? 2 : 1;
            select.value = randomNum;
          });
          // iframe里或者自动发肉就提交
          if (window.self !== window.top || isAutoEat) {
            submit?.click();
          }
        } else {
          let tip = document.querySelector(".tip");
          if (tip) {
            let publishNumber = getItem("publishNumber", "0");

            setTimeout(() => {
              if (publishNumber <= 0) {
                setItem("publishNumber", "0");
                location.href = "/games/chuiniu/index.aspx";
              } else {
                setItem("publishNumber", publishNumber - 1);
                location.href = "/games/chuiniu/add.aspx?open=new";
              }
            }, 500);
          }
        }
      }
    }

    // 查看记录
    if ("/games/chuiniu/book_list.aspx".includes(location.pathname)) {
      handleAddSearch();
      handleStatistics();
      // 处理如果是进行中则直接跳转到对应吃牛页面
      let list = document.querySelectorAll(
        "a[href^='/games/chuiniu/book_view.aspx']"
      );
      for (let index = 0; index < list.length; index++) {
        const item = list[index];
        let id = item.innerText;
        if (item.parentElement.innerText.includes("进行中")) {
          item.href = `/games/chuiniu/doit.aspx?siteid=1000&classid=0&id=${id}`;
        }
      }
    }
    // 查看状态
    if ("/games/chuiniu/book_view.aspx".includes(location.pathname)) {
      let content = document.querySelector(".content");
      let id = getUrlParameters().id;
      if (content.innerText.includes("状态:进行中")) {
        content.insertAdjacentHTML(
          "beforeend",
          `<a href="/games/chuiniu/doit.aspx?siteid=1000&classid=0&id=${id}">一键跳转</a>`
        );
      }
    }
    async function handleStatistics(isReturnResult = false) {
      let title = document.querySelector(".title");
      title.insertAdjacentHTML(
        "afterend",
        `
        <div class="line1 statistics-btn-wrap">
        <a class="statistics-btn-left">统计当页数据</a>

        <a class="statistics-btn-right">统计指定页数据</a>
        </div>
        `
      );
      MY_addStyle(`
        .statistics-btn-wrap {
          display: flex;
          justify-content: space-around;
        }
        .statistics-btn-wrap a{
          background: #888888;
          border-radius: 5px;
          width: 48%;
          color: #fff;
          box-sizing: border-box;
          display: inline-block;
          text-align: center;
          cursor: pointer;
        }
        /* 已访问的链接状态 */
        .statistics-btn-wrap a:visited{
          color: #fff;
        }
        /* 正在点击链接时的状态 */
        .statistics-btn-wrap a:active{
          color: #fff;
        }
      `);
      let isClick = false;
      $(".statistics-btn").click(async () => {
        if (!isClick) {
          isClick = true;
          await handleData();
          isClick = false;
        }
      });
      $(".statistics-btn-right").click(async () => {
        if (!isClick) {
          isClick = true;
          let todayFirstId = getItem("todayFirstId", "0");
          let number = prompt(
            "请输入要查询页数或者截止的id：",
            parseInt(todayFirstId) || 5
          );

          if (!/^\d+$/.test(number)) {
            isClick = false;
            return;
          }

          let isId = number?.length > 5;
          if (number.length > 5) {
            setItem("todayFirstId", number);
          }

          number = parseInt(number);
          if (number <= 0) {
            isClick = false;
            return;
          }
          if (number > 50 && number < 100000) {
            alert("输入的页数或者id不对，页数需小于50页，id需大于100000");
            isClick = false;
            return;
          }
          // if (number > 10) {
          //   number = 10;
          // }
          let url = location.href;
          let initPage = getUrlParameters().page || 1;

          if (!/(&|\?)page=/.test(url)) {
            url += "&page=1";
          }
          let innerHTML = "";
          for (let index = 0; index < number; index++) {
            let newUrl = url.replace(
              /([?|&]page=)(\d*)/,
              function (match, prefix, pageNumber) {
                let newPageNumber = parseInt(pageNumber || 1) + index;
                return prefix + newPageNumber;
              }
            );
            console.log(newUrl);
            let res = await fetchData(newUrl);
            let match = /<body>([\s\S]*?)<\/body>/.exec(res);
            let bodyString = match?.[0];
            bodyString = bodyString.replace(
              /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
              ""
            );
            innerHTML += bodyString;
            if (isId && bodyString.includes(number)) {
              break;
            }
            // 大于50页说明传的数据有问题,直接退出
            if (index > 50 * 15) {
              break;
            }
          }
          let tempDiv = document.createElement("div");
          tempDiv.innerHTML = innerHTML;
          console.log(tempDiv);

          if (Number(searchBoastLogType) === 1) {
            // 简略模式
            let res = await getMyBoastData(tempDiv, isId ? number : 0);
            let { total, isFinished, lastIsWin, moneyChange, win, winRate } =
              res;
            alert(
              `
              ====${
                isId ? "今日" : `最近${number}页`
              }发吹牛总条数：${total}===\n
              发吹牛赢的次数：${win}，胜率：${winRate}\n
              ${moneyChange > 0 ? "赢了" : "输了"}${Math.abs(moneyChange)}妖精\n
              `
            );
          } else {
            // 详细模式
            let res = await handleData(tempDiv, true, isId ? number : 0);

            let {
              total,
              tzSelect1,
              tzSelect2,
              tzSelect1Win,
              tzSelect2Win,
              tzWin,
              tzWinRate,
              yzSelect1,
              yzSelect2,
              yzSelect1Win,
              yzSelect2Win,
              tzSelectString,
              tzSelectDomString,
              yzSelectString,
              tzMoney,
              yzMoney,
            } = res;
            alert(
              `
            ====${isId ? "今日" : `最近${number}页`}发吹牛总条数：${total}===\n
            发吹牛选1的次数：${tzSelect1}，选2的次数：${tzSelect2}\n
            实际发吹牛选1赢的概率：${(tzSelect1Win / total).toFixed(
              2
            )}，选2赢的概率：${(tzSelect2Win / total).toFixed(2)}\n
            如果吃吹牛选1赢的概率：${(tzSelect1 / total).toFixed(
              2
            )}，选2赢的概率：${(tzSelect2 / total).toFixed(2)}\n
            发吹牛赢的次数：${tzWin}，胜率：${tzWinRate}，${
                tzMoney > 0 ? "赢了" : "输了"
              }${Math.abs(tzMoney)}妖精\n
            ====${isId ? "今日" : `最近${number}页`}吹牛总条数：${total}====\n
            吃吹牛选1的次数：${yzSelect1}，选2的次数：${yzSelect2}\n
            实际吃吹牛实际选1赢的概率：${(yzSelect1Win / total).toFixed(
              2
            )}，选2赢的概率：${(yzSelect2Win / total).toFixed(2)}\n
            如果发吹牛选1赢的概率：${((total - yzSelect1) / total).toFixed(
              2
            )}，选2赢的概率：${((total - yzSelect2) / total).toFixed(2)}\n
            吃吹牛赢的次数：${total - tzWin}，吃吹牛的胜率：${(
                1 - tzWinRate
              ).toFixed(2)}，${yzMoney > 0 ? "赢了" : "输了"}${Math.abs(
                yzMoney
              )}妖精
            `
            );
          }

          isClick = false;
        }
      });
    }
    async function handleData(dom = document, isReturnResult = false) {
      let list = dom.querySelectorAll(
        "a[href^='/games/chuiniu/book_view.aspx']"
      );
      let total = 0;
      let tzSelect1 = 0;
      let tzSelect2 = 0;
      let tzSelect1Win = 0;
      let tzSelect2Win = 0;
      let yzSelect1 = 0;
      let yzSelect2 = 0;
      let yzSelect1Win = 0;
      let yzSelect2Win = 0;

      let tzWin = 0;
      let tzWinRate = 0;

      let tzSelectString = "";
      let yzSelectString = "";
      let tzSelectDomString = "";
      let tzMoney = 0;
      let yzMoney = 0;

      let boastData = getItem("boastData");

      for (let index = 0; index < list.length; index++) {
        const item = list[index];
        let id = item.innerText;
        if (item.parentElement.innerText.includes("进行中")) {
          continue;
        }
        // if (isReturnResult && total >= 10) {
        //   break;
        // }

        let curData;
        if (boastData[id]) {
          curData = boastData[id];
        } else {
          let url = item.href;
          let res = await fetchData(url);
          let regex = /<body>([\s\S]*?)<\/body>/;
          let match = regex.exec(res);
          let bodyString = match?.[0];
          if (bodyString.includes("不存在此挑战！")) {
            continue;
          }
          let money = bodyString.match(/赌注是:(\d+)妖晶/)[1];
          // 获取挑战方出的答案：发吹牛的人
          let challengerAnswer =
            bodyString.match(/挑战方出的是\[答案(\d)\]/)[1];

          // 获取应战方出的答案：接吹牛的人
          let opponentAnswer = bodyString.match(/应战方出的是\[答案(\d)\]/)[1];

          // 获取对应战方状态
          let battleStatus = bodyString.match(
            /对应战方状态:<b>(获胜|失败)!<\/b>/
          )[1];

          curData = {
            id,
            money,
            challengerAnswer,
            opponentAnswer,
            battleStatus,
            lastTime: new Date().getTime(),
          };
          boastData[id] = curData;
          setItem("boastData", boastData);
        }
        tzSelectString += curData.challengerAnswer;
        yzSelectString += curData.opponentAnswer;
        tzSelectDomString += `<b style="color:${
          curData.battleStatus === "失败" ? "red" : "green"
        }">${curData.challengerAnswer}</b>`;

        total++;

        if (curData.battleStatus === "获胜") {
          // 吃吹牛获胜、发吹牛失败
          if (curData.opponentAnswer == 1) {
            // 吃吹牛的人选1
            yzSelect1++;
            tzSelect1++;
            yzSelect1Win++;
          } else {
            // 吃吹牛的人选2
            yzSelect2++;
            tzSelect2++;
            yzSelect2Win++;
          }
          tzMoney += -curData.money;
          yzMoney += curData.money * 0.9;
        } else {
          // 吃吹牛失败、发吹牛获胜
          tzWin++;
          tzWinRate = (tzWin / total).toFixed(2);

          // 失败
          if (curData.opponentAnswer == 1) {
            // 吃吹牛的人选1
            yzSelect1++;
            tzSelect2++;
            tzSelect2Win++;
          } else {
            // 吃吹牛的人选2
            yzSelect2++;
            tzSelect1++;
            tzSelect1Win++;
          }
          tzMoney += curData.money * 0.9;
          yzMoney += -curData.money;
        }
      }
      tzMoney = tzMoney.toFixed(2);
      yzMoney = yzMoney.toFixed(2);
      if (isReturnResult) {
        return {
          total,
          tzSelect1,
          tzSelect2,
          tzSelect1Win,
          tzSelect2Win,
          tzWin,
          tzWinRate,
          yzSelect1,
          yzSelect2,
          yzSelect1Win,
          yzSelect2Win,
          tzSelectString,
          tzSelectDomString,
          yzSelectString,
          tzMoney,
          yzMoney,
        };
      } else {
        alert(
          `
          ====当前页发吹牛总条数：${total}===\n
          发吹牛选择：${tzSelectString}\n
          发吹牛选1的次数：${tzSelect1}，选2的次数：${tzSelect2}\n
          实际发吹牛选1赢的概率：${(tzSelect1Win / total).toFixed(
            2
          )}，选2赢的概率：${(tzSelect2Win / total).toFixed(2)}\n
          如果吃吹牛选1赢的概率：${(tzSelect1 / total).toFixed(
            2
          )}，选2赢的概率：${(tzSelect2 / total).toFixed(2)}\n
          发吹牛赢的次数：${tzWin}，胜率：${tzWinRate}，${
            tzMoney > 0 ? "赢了" : "输了"
          }${Math.abs(tzMoney)}妖精\n
          ====当前页吃吹牛总条数：${total}====\n
          吃吹牛选择：${yzSelectString}\n
          吃吹牛选1的次数：${yzSelect1}，选2的次数：${yzSelect2}\n
          实际吃吹牛实际选1赢的概率：${(yzSelect1Win / total).toFixed(
            2
          )}，选2赢的概率：${(yzSelect2Win / total).toFixed(2)}\n
          如果发吹牛选1赢的概率：${((total - yzSelect1) / total).toFixed(
            2
          )}，选2赢的概率：${((total - yzSelect2) / total).toFixed(2)}\n
          吃吹牛赢的次数：${total - tzWin}，吃吹牛的胜率：${(
            1 - tzWinRate
          ).toFixed(2)}，${yzMoney > 0 ? "赢了" : "输了"}${Math.abs(
            yzMoney
          )}妖精
          `
        );
      }
    }
    async function getMyBoastData(tempDiv, endId = 0) {
      if (!tempDiv) {
        tempDiv = tempDiv || document;
        let btn = tempDiv.querySelector(
          "a[href^='/games/chuiniu/book_list.aspx']"
        );
        if (btn.innerText !== "我的大话") {
          return {
            isFinished: false,
            moneyChange: 0,
          };
        }
        let url = btn.href;

        let res = await fetchData(url);
        let match = /<body>([\s\S]*?)<\/body>/.exec(res);
        let bodyString = match?.[0];
        tempDiv = document.createElement("div");
        tempDiv.innerHTML = bodyString;
      }

      let list = tempDiv.querySelectorAll(
        "a[href^='/games/chuiniu/book_view.aspx'], a[href^='/games/chuiniu/doit.aspx']"
      );
      // let boastData = getItem("boastData");
      // let statusAry = [];
      // let moneyAry = [];
      let count = 1;
      let total = 0;
      let lastIsWin = false;
      let isFirstWin = false;
      let isFinished = true;
      let moneyChange = 0;
      let win = 0;
      for (let index = 0; index < list.length; index++) {
        const item = list[index];
        let id = item.innerText;
        let innerText = item.parentElement.innerText;
        if (endId && parseInt(endId) > parseInt(id)) {
          break;
        }

        total++;

        if (innerText.includes("进行中")) {
          isFinished = false;
          // return {
          //   isFinished: false,
          //   lastIsWin,
          // };
        } else {
          let matchResult = innerText.match(/(赚了|输了)(\d+)妖晶/);
          let status = matchResult[1];
          let money = matchResult[2];
          if (status === "输了") {
            if (!isFirstWin) {
              count++;
            }
            moneyChange -= Number(money);
          } else {
            if (count === 1) {
              lastIsWin = true;
            }
            isFirstWin = true;
            win++;
            moneyChange += Number(money * 0.9);
          }
        }
      }
      moneyChange = moneyChange.toFixed(2);
      let winRate = (win / total).toFixed(2);
      return {
        total,
        win,
        winRate,
        isFinished,
        lastIsWin,
        moneyChange,
        nextMoney: getNextMoney(count, !lastIsWin),
      };
    }
    function handleAddSearch() {
      let arr = ["/games/chuiniu/book_list.aspx", "/games/chuiniu/index.aspx"];
      if (!arr.includes(location.pathname)) {
        return;
      }
      let title = document.querySelector(".title");
      title.insertAdjacentHTML(
        "beforeend",
        `
        <span class="separate"> </span>
        <a class="search-dahua">查询大话</a>
        <span class="separate"> </span>
        <a class="search-qianghua">查询抢话</a>
        `
      );
      // 查询大话
      $(".search-dahua").click(() => {
        let defaultValue = isMobile() ? "0" : "";
        let res = prompt(
          "请输入要查询大话的用户id，输入0查询全部",
          defaultValue
        );
        if (res === null) return;
        if (!res || /^\d+$/.test(res)) {
          location.href = `/games/chuiniu/book_list.aspx?type=0&touserid=${
            res <= 0 ? "" : res
          }&siteid=1000&classid=0`;
        }
      });
      // 查询抢话
      $(".search-qianghua").click(() => {
        let defaultValue = isMobile() ? "0" : "";
        let res = prompt(
          "请输入要查询抢话的用户id，输入0查询全部",
          defaultValue
        );
        if (res === null) return;
        if (!res || /^\d+$/.test(res)) {
          location.href = `/games/chuiniu/book_list.aspx?type=1&touserid=${
            res <= 0 ? "" : res
          }&siteid=1000&classid=0`;
        }
      });
    }
    //  获取用户id
    async function getUserId(url) {
      let res = await fetchData(url);
      let id = res.match(/<b>ID号:<\/b>(\d+)/)?.[1];
      return id;
    }
  }
  function getNextMoney(n, isAddCommission = false) {
    autoPublishBoastStrategy = isNaN(autoPublishBoastStrategy)
      ? 500
      : autoPublishBoastStrategy;
    let number =
      Number(autoPublishBoastStrategy) === 1
        ? generateSequenceByAdd(autoPublishBoastInitialValue, n)[n - 1]
        : generateSequenceByMultiply(autoPublishBoastInitialValue, n)[n - 1];
    // 指定前几把增加手续费
    return isAddCommission && n <= addCommissionCount
      ? Math.floor(number / 0.9)
      : number;
  }
  /**
   * 策略1：下一次金额为最近两次之和
   * @param {number} n 第几回合
   * @returns 返回第几回合的金额
   */
  function generateSequenceByAdd(initialValue = 500, n = 10) {
    let result = [parseFloat(initialValue)];

    if (n === 1) {
      return result;
    }

    result.push(initialValue <= 1000 ? initialValue * 2 : initialValue * 1.5);

    for (let i = 2; i < n; i++) {
      let nextValue = parseFloat(result[i - 1]) + parseFloat(result[i - 2]);
      result.push(nextValue);
    }

    return result;
  }
  /**
   * 策略2：下一次金额为最近一次的两倍
   * @param {number} n 第几回合
   * @returns 返回第几回合的金额
   */
  function generateSequenceByMultiply(initialValue = 500, n = 10) {
    let result = [parseFloat(initialValue)];
    if (!multiplyRate && !multiplyRate.length) {
      multiplyRate = [3, 2.5, 2.1, 2];
    }

    for (let i = 1; i < n; i++) {
      const previousValue = result[i - 1];
      const currentValue =
        previousValue * (multiplyRate[i - 1] || strategy2DefaultRate || 2);
      result.push(currentValue);
    }

    return result;
  }
  // 封装请求
  async function fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.text();
      return data;
    } catch (error) {
      // 处理错误
      console.error("Error:", error);
      return error;
    }
  }
  function MY_addStyle(innerHTML) {
    // 创建 style 元素
    let style = document.createElement("style");
    style.type = "text/css";

    // 设置样式内容
    let css = innerHTML;
    style.innerHTML = css;

    // 将 style 元素添加到 head 元素中
    document.head.appendChild(style);
  }
  // 获取url参数
  function getUrlParameters() {
    var search = window.location.search.substring(1); // 去除 "?"
    var parameters = {};

    if (search) {
      var paramsArray = search.split("&");

      for (var i = 0; i < paramsArray.length; i++) {
        var param = paramsArray[i].split("=");
        var paramName = decodeURIComponent(param[0]);
        var paramValue = decodeURIComponent(param[1]);

        // 存储参数名和参数值到对象中
        parameters[paramName] = paramValue;
      }
    }

    return parameters;
  }
  function MY_setValue(key, value) {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    localStorage.setItem(key, value);
  }
  function MY_getValue(key, defaultValue = {}) {
    const value = localStorage.getItem(key) || defaultValue;
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  // 获取值
  function getItem(key, defaultValue = {}) {
    if (["boastData", "autoEatList".includes(key)]) {
      let list = MY_getValue(key, {});
      // 删除过期的肉帖
      deleteExpiredID(list, key);
      // 更新肉帖数据
      setItem(key, list);
      return list;
    }
    return MY_getValue(key, defaultValue);
  }
  // 设置值
  function setItem(key, value) {
    // if (key === "autoEatList") {
    //   deleteExpiredID(value); //删除过期的肉帖
    // }
    MY_setValue(key, value);
  }

  function isMobile() {
    return /Mobile/i.test(navigator.userAgent);
  }
  function timeLeft(time, days = 1) {
    const target = new Date(time + (days - 1) * 24 * 60 * 60 * 1000);
    target.setHours(24, 0, 0, 0);
    return target.getTime();
  }
  /**
   * 删除过期的帖子
   * @param {number|string} value 存储肉帖的对象
   */
  function deleteExpiredID(value, key) {
    let nowTime = new Date().getTime();
    // 吹牛数据默认存储7天
    let expire = key === "boastData" ? 5 : 1;
    let lastTime;
    Object.keys(value).forEach((key) => {
      if (key === "boastData") {
        lastTime = value[key]["lastTime"];
      } else {
        lastTime = value[key];
      }
      if (nowTime > timeLeft(lastTime, expire)) {
        delete value[key];
      }
    });
  }

  /**
   * 简易版jquery实现，用于替换之前写的部分语法，不引用cdn库
   * @returns
   */
  function myJquery() {
    let jQuery = function (selector) {
      return new jQuery.fn.init(selector);
    };

    jQuery.fn = jQuery.prototype = {
      constructor: jQuery,

      init: function (selector) {
        if (!selector) {
          return this;
        }

        if (typeof selector === "string") {
          let elements = document.querySelectorAll(selector);
          this.length = elements.length;
          for (let i = 0; i < elements.length; i++) {
            this[i] = elements[i];
          }
        } else if (selector.nodeType) {
          this[0] = selector;
          this.length = 1;
        } else if (selector instanceof jQuery) {
          return selector;
        } else if (Array.isArray(selector)) {
          for (let i = 0; i < selector.length; i++) {
            this[i] = selector[i];
          }
          this.length = selector.length;
          return this;
        }

        return this;
      },

      length: 0,

      each: function (callback) {
        for (let i = 0; i < this.length; i++) {
          callback.call(this[i], i, this[i]);
        }

        return this;
      },

      css: function (prop, value) {
        if (typeof prop === "string") {
          if (value !== undefined) {
            this.each(function () {
              this.style[prop] = value;
            });
            return this;
          } else {
            return this[0].style[prop];
          }
        } else {
          for (let key in prop) {
            this.each(function () {
              this.style[key] = prop[key];
            });
          }
          return this;
        }
      },

      text: function (text) {
        if (text !== undefined) {
          this.each(function () {
            this.textContent = text;
          });
          return this;
        } else {
          let result = "";
          this.each(function () {
            result += this.textContent;
          });
          return result;
        }
      },

      html: function (html) {
        if (html !== undefined) {
          this.each(function () {
            this.innerHTML = html;
          });
          return this;
        } else {
          return this[0].innerHTML;
        }
      },

      append: function (content) {
        if (typeof content === "string") {
          this.each(function () {
            this.insertAdjacentHTML("beforeend", content);
          });
        } else if (content.nodeType) {
          this.each(function () {
            this.appendChild(content);
          });
        } else if (content instanceof jQuery) {
          this.each(function () {
            let self = this;
            content.each(function () {
              self.appendChild(this);
            });
          });
        }

        return this;
      },

      addClass: function (className) {
        let classNames = className.split(" ");
        this.each(function () {
          for (let i = 0; i < classNames.length; i++) {
            if (this.classList) {
              this.classList.add(classNames[i]);
            } else {
              let currentClasses = this.className.split(" ");
              if (currentClasses.indexOf(classNames[i]) === -1) {
                this.className += " " + classNames[i];
              }
            }
          }
        });

        return this;
      },

      removeClass: function (className) {
        let classNames = className.split(" ");
        this.each(function () {
          for (let i = 0; i < classNames.length; i++) {
            if (this.classList) {
              this.classList.remove(classNames[i]);
            } else {
              let currentClasses = this.className.split(" ");
              let index = currentClasses.indexOf(classNames[i]);
              if (index !== -1) {
                currentClasses.splice(index, 1);
                this.className = currentClasses.join(" ");
              }
            }
          }
        });

        return this;
      },

      show: function () {
        this.each(function () {
          // 恢复元素之前的display属性
          let classDisplay = getComputedStyle(this).getPropertyValue("display");
          let display =
            this.getAttribute("data-display") ||
            (classDisplay === "none" ? "block" : classDisplay);
          this.style.display = display ? display : "";
        });

        return this;
      },

      hide: function () {
        this.each(function () {
          // 记住元素之前的display属性
          let display =
            this.style.display ||
            getComputedStyle(this).getPropertyValue("display");
          if (display !== "none") {
            this.setAttribute("data-display", display);
          }
          this.style.display = "none";
        });

        return this;
      },

      click: function (callback) {
        this.each(function () {
          this.addEventListener("click", callback);
        });

        return this;
      },

      on: function (event, childSelector, data, handler) {
        if (typeof childSelector === "function") {
          handler = childSelector;
          childSelector = null;
          data = null;
        } else if (typeof data === "function") {
          handler = data;
          data = null;
        }

        this.each(function () {
          let element = this;

          let listener = function (e) {
            let target = e.target;
            if (
              !childSelector ||
              element.querySelector(childSelector) === target
            ) {
              handler.call(target, e, data);
            }
          };

          event.split(" ").forEach(function (type) {
            element.addEventListener(type, listener);
          });
        });

        return this;
      },

      prev: function () {
        let prevElement = null;
        this.each(function () {
          prevElement = this.previousElementSibling;
        });

        return jQuery(prevElement);
      },

      next: function () {
        let nextElement = null;
        this.each(function () {
          nextElement = this.nextElementSibling;
        });

        return new jQuery(nextElement);
      },

      children: function (selector) {
        let childElements = [];
        this.each(function () {
          let children = this.children;
          for (let i = 0; i < children.length; i++) {
            if (!selector || children[i].matches(selector)) {
              childElements.push(children[i]);
            }
          }
        });

        return jQuery(childElements);
      },

      parent: function (selector) {
        let parentElements = [];
        this.each(function () {
          let parent = this.parentElement;
          if (!selector || parent.matches(selector)) {
            parentElements.push(parent);
          }
        });
        return jQuery(parentElements);
      },

      prop: function (name, value) {
        if (value === undefined) {
          let element = this[0] || {};
          return element[name];
        } else {
          this.each(function () {
            this[name] = value;
          });

          return this;
        }
      },

      remove: function () {
        this.each(function () {
          this.parentElement.removeChild(this);
        });

        return this;
      },

      height: function (value) {
        if (value === undefined) {
          if (this[0]) {
            return this[0].clientHeight;
          } else {
            return null;
          }
        } else {
          this.each(function () {
            this.style.height = isNaN(value) ? value : value + "px";
          });
          return this;
        }
      },
    };

    jQuery.fn.init.prototype = jQuery.fn;

    return jQuery;
  }
})();
