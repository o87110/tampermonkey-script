// ==UserScript==
// @name         【测试版】妖火网吹牛插件
// @namespace    https://yaohuo.me/
// @version      0.1.0
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
  let myPassword = "";
  // 是否是自动吃牛
  let isAutoEatBoast = false;
  // 设置大于多少妖精才自动吃牛
  let minMoney = 690000;
  // 设置自动吃牛最大数量，当前牛妖精小于等于这个数才自动吃
  let eatBoastMaxNum = 500;
  console.log("------插件开始-------");
  // ==主代码执行==
  (function () {
    // 吹牛增强
    handleBoast();
  })();
  // ==其他功能函数和方法==

  // 处理吹牛
  async function handleBoast() {
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

      for (const item of list) {
        let match = item.innerHTML.match(/\((\d+)妖晶\)$/);
        let number = parseInt(match[1]);
        let href = item.getAttribute("href");

        let newHref = href.includes("?")
          ? `${href}&open=new`
          : `${href}?open=new`;

        if (number <= eatBoastMaxNum) {
          console.log(`当前小于最大自动吃牛数：${eatBoastMaxNum}`);
          if (isAutoEatBoast && money.innerText > minMoney + eatBoastMaxNum) {
            // item.click();
            location.href = newHref;
          }
        }
      }
      let publishBoastBtn = document.querySelector(
        "a[href^='/games/chuiniu/add.aspx']"
      );
      if (publishBoastBtn.innerText === "我要公开挑战") {
        // 添加批量按钮
        publishBoastBtn.insertAdjacentHTML(
          "afterend",
          `<input type="button" class="batch-publish-btn" value='批量公开挑战' style="color: #fff; font-size: 14px; background-color: #888888;border-radius: 10%;margin-left:10px">`
        );
        $(".batch-publish-btn").click(() => {
          if (isMobile()) {
            alert("暂时只支持pc端，批量发布吹牛，移动端等后续适配");
            return;
          }
          let res = prompt("请输入批量公开挑战的数量：", 10);
          if (res && /^\d+$/.test(res)) {
            let i = 0;
            let isfirst = true;
            while (i < res) {
              i++;
              // if (!isMobile()) {
              setTimeout(() => {
                let iframe = document.createElement("iframe");

                // 设置 iframe 的属性
                iframe.src = publishBoastBtn.href;
                // iframe.style.display = "none";
                document.body.appendChild(iframe);
                if (isfirst) {
                  isfirst = false;
                  handleIframeMutationObserver();
                }
              }, (i + 1) * 100);
              // }
            }
          } else if (res) {
            alert("输入的格式不对，只能是大于0的数字");
          }
          console.log(res);
        });
      }
    }

    // 吃吹牛页面
    if ("/games/chuiniu/doit.aspx".includes(location.pathname)) {
      let password = document.querySelector("input[type=password]");
      let submit = document.querySelector("input[type=submit]");
      let select = document.querySelector("select");
      let subTitle = document.querySelector(".subtitle");
      // 吃多吃2少吃1
      let answer1Rate = 0.5;
      let randomNum = Math.random() < answer1Rate ? 1 : 2;
      let isAutoEat = window.location.search.includes("open=new");
      if (document.title === "请输入密码") {
        if (!password.value) {
          password.value = myPassword;
        }
        if (password.value) {
          submit.click();
        }
      } else if (document.title === "应战") {
        // 应战结果就返回
        if (!select) {
          location.href = "/games/chuiniu/index.aspx";
          return;
        }
        select.value = randomNum;
        // 添加查询历史数据
        if (subTitle) {
          subTitle.insertAdjacentHTML(
            "beforeend",
            `<input type="button" class="search-history-data" value='查询历史数据' style="color: #fff; font-size: 14px; background-color: #888888;border-radius: 10%;margin-left:10px">`
          );
          subTitle.insertAdjacentHTML(
            "afterend",
            `<div class='subTitleTips' style="padding:5px">
            <span style="color:red">正在分析发牛者历史数据，请等待，数据生成后会根据概率重新生成答案</span>
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
            } = res;
            document.querySelector(".subTitleTips").innerHTML = `
              <p>发牛者过去${total}条中，选择了：${tzSelectDomString}，答案一：${tzSelect1}次，选择答案二：${tzSelect2}次</p>
              <p>选择1胜率：
              <span style="color:${tzSelect1 > tzSelect2 ? "red" : "unset"}">
              ${(tzSelect1 / total).toFixed(2)}
              </span>
              ，选择2胜率：
              <span style="color:${tzSelect1 < tzSelect2 ? "red" : "unset"}">${(
              tzSelect2 / total
            ).toFixed(2)}</span></p>
            `;

            answer1Rate = tzSelect1 / total;

            randomNum = Math.random() < answer1Rate ? 1 : 2;
            select.value = randomNum;
            console.log("生成答案1的概率：", answer1Rate);
          }
          $(".search-history-data").click(async () => {
            // let userId = await getUserId(spaceUrl);
            // let url = `/games/chuiniu/book_list.aspx?type=0&touserid=${userId}&siteid=1000&classid=0`;
            location.href = url;
          });
        }

        let payMoney = document
          .querySelector("form")
          ?.innerText.match(/赌注是 (\d+) 妖晶/)?.[1];
        if (isAutoEat && payMoney && payMoney <= eatBoastMaxNum) {
          submit.click();
        }
        select.insertAdjacentHTML(
          "afterend",
          `<input type="button" class="random-number-btn" value='随机生成答案' style="color: #fff; font-size: 14px; background-color: #888888;border-radius: 10%;">`
        );
        $(".random-number-btn").click((e) => {
          randomNum = Math.random() < answer1Rate ? 1 : 2;
          select.value = randomNum;
        });

        console.log(`随机答案：${randomNum},是否吃吹牛`);
      } else {
        // history.back();
        location.href = "/games/chuiniu/index.aspx";
      }
    }

    // 发布吹牛页面
    if ("/games/chuiniu/add.aspx".includes(location.pathname)) {
      let password = document.querySelector("input[type=password]");
      let submit = document.querySelector("input[type=submit]");
      let select = document.querySelector("select");
      let answer1Rate = 0.5;
      let randomNum = Math.random() < answer1Rate ? 2 : 1;

      if (document.title === "请输入密码") {
        if (!password.value) {
          password.value = myPassword;
        }
        if (password.value) {
          submit.click();
        }
      } else if (document.title === "公开挑战") {
        if (select) {
          select.value = randomNum;
          select.insertAdjacentHTML(
            "afterend",
            `<input type="button" class="random-number-btn" value='随机生成答案' style="color: #fff; font-size: 14px; background-color: #888888;border-radius: 10%;">`
          );

          $(".random-number-btn").click((e) => {
            // 发布多发2少发1
            let randomNum = Math.random() < answer1Rate ? 2 : 1;
            select.value = randomNum;
          });
          // iframe里
          if (window.self !== window.top) {
            submit?.click();
          }
        } else {
          // iframe里
          if (window.self !== window.top) {
            let tip = document.querySelector(".tip");
            if (tip) {
              setTimeout(() => {
                console.log("这是iframe页面3");
                let iframe = window.frameElement; // 获取当前 iframe 元素
                let parent = iframe.parentElement; // 获取包含当前 iframe 的父窗口对象

                parent.removeChild(iframe);
              }, 2000);
            }
          } else {
            location.href = "/games/chuiniu/index.aspx";
          }
        }
      }
    }

    // 查看记录
    if ("/games/chuiniu/book_list.aspx".includes(location.pathname)) {
      handleAddSearch();
      handleStatistics();
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
        <div class="line1">
        <a class="statistics-btn">统计当页数据，点击后请等待弹窗返回数据</a>
        </div>
        `
      );
      let isClick = false;
      $(".statistics-btn").click(async () => {
        if (!isClick) {
          isClick = true;
          await handleData();
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

      let boastData = getItem("boastData");
      for (let index = 0; index < list.length; index++) {
        const item = list[index];
        let id = item.innerText;
        if (item.parentElement.innerText.includes("进行中")) {
          continue;
        }
        if (isReturnResult && total >= 10) {
          break;
        }
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
        total++;
        // 只返回10条

        tzSelectString += curData.challengerAnswer;
        yzSelectString += curData.opponentAnswer;
        tzSelectDomString += `<b style="color:${
          curData.battleStatus === "失败" ? "red" : "green"
        }">${curData.challengerAnswer}</b>`;
        //  autoEatList[id]['lastTime'] = new Date().getTime();

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
        }
      }
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
        };
      } else {
        console.log({
          total,
          tzSelectString,
          yzSelectString,
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
          yzSelectString,
        });
        alert(
          `
          =====当前页发吹牛总条数：${total}====
          发吹牛选择：${tzSelectString}\n
          发吹牛选1的次数：${tzSelect1}，选2的次数：${tzSelect2}\n
          实际发吹牛选1赢的概率：${(tzSelect1Win / total).toFixed(
            2
          )}，选2赢的概率：${(tzSelect2Win / total).toFixed(2)}\n
          如果吃吹牛选1赢的概率：${(tzSelect1 / total).toFixed(
            2
          )}，选2赢的概率：${(tzSelect2 / total).toFixed(2)}\n
          发吹牛赢的次数：${tzWin}，胜率：${tzWinRate}\n
          =====当前页吃吹牛总条数：${total}=====
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
          ).toFixed(2)}\n
          `
        );
      }
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
    // 监听iframe移除时刷新页面
    function handleIframeMutationObserver() {
      const observer = new MutationObserver(function (mutationsList, observer) {
        for (let mutation of mutationsList) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
              if (node.tagName === "IFRAME") {
                return; // 存在 <iframe> 元素，不执行操作
              }
            }
          }
        }

        // 当前页面没有 <iframe> 元素，执行操作
        setTimeout(() => {
          location.reload();
        }, 1000);

        // 停止观察
        observer.disconnect();
      });

      // 配置观察选项
      const observerConfig = {
        childList: true, // 监听子节点的变化
        subtree: true, // 监听后代节点的变化
      };

      const targetNode = document.body;

      observer.observe(targetNode, observerConfig);
    }
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
    return MY_getValue(key, {});
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
    let expire = key === "boastData" ? 5 : expiredDays;
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
