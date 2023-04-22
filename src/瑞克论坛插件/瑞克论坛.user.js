// ==UserScript==
// @name         瑞克论坛插件
// @namespace    https://www.ruike1.com/
// @version      0.1
// @description  瑞克网站的一些脚本
// @author       You
// @match        *ruike1.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setClipboard
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  ("use strict");

  let signInBtn = document.querySelector("#fx_checkin_b");
  let thread_types = document.querySelector("#thread_types");
  // 自动签到
  if (signInBtn.alt === "点击签到") {
    signInBtn.click();
  }
  if (thread_types) {
    thread_types.insertAdjacentHTML(
      "beforeend",
      `<li class='copy-wrap'><a style="background: #1890ff;color: #fff;cursor: pointer;">复制标题</a></li>`
    );
    let copyBtn = document.querySelector(".copy-wrap");
    let row = document.querySelectorAll('[id^="normalthread"] > tr');
    row.forEach((item) => {
      item.insertAdjacentHTML(
        "afterbegin",
        `<td class="checkbox-td" style="width:30px;text-align:center"><input type="checkbox" name="select-title" class="checkbox-select" style="width:20px;height:20px"></td>`
      );
    });

    copyBtn.onclick = function (event) {
      let checkbox = document.querySelectorAll(".checkbox-select");
      let titleAry = [];
      let noCheckAry = [];
      checkbox.forEach((item) => {
        let parent =
          item.parentElement.tagName === "TR"
            ? item.parentElement
            : item.parentElement.parentElement;
        let text = parent.querySelector(".common .xst").innerText;

        if (item.checked) {
          titleAry.push(text);
        } else {
          noCheckAry.push(text);
        }
      });
      let checkStr = titleAry.join("\n");
      let noCheckStr = noCheckAry.join("\n");
      GM_setClipboard(checkStr ? checkStr : noCheckStr);
    };
  }
})();
