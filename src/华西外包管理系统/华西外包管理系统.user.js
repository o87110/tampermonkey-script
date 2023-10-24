// ==UserScript==
// @name         华西外包管理系统
// @namespace    https://odms.hx168.com.cn/
// @version      0.1
// @description  增强系统
// @author       You
// @match        *odms.hx168.com.cn/*
// @icon         https://odms.hx168.com.cn/logo.png
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  // 填写周报页面
  if (location.pathname === "/weekly-management/fillout-breadcrumb") {
    // 修改需求列样式
    GM_addStyle(`
      .ant-table-tbody > tr > td:nth-child(4) .ant-select{
        width: 600px !important;
      }
    `);
  }
})();
