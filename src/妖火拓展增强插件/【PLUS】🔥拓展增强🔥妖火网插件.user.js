// ==UserScript==
// @name         【PLUS自用】🔥拓展增强🔥妖火网插件
// @namespace    https://yaohuo.me/
// @version      3.2.2
// @description  发帖ubb增强、回帖ubb增强、查看贴子显示用户等级增强、半自动吃肉增强、全自动吃肉增强、自动加载更多帖子、自动加载更多回复、支持个性化菜单配置
// @author       龙少c(id:20469)开发，参考其他大佬：外卖不用券(id:23825)、侯莫晨、Swilder-M
// @match        *://yaohuo.me/*
// @match        *://*.yaohuo.me/*
// @icon         https://yaohuo.me/css/favicon.ico
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  // 实现简易版替换用到的jquery，全部换成原生js太麻烦
  let $, jQuery;
  $ = jQuery = myJquery();

  let settingData = {
    // 是否显示站内图标
    isShowSettingIcon: true,
    // 是否开启自动吃肉，手动进去肉帖自动吃肉
    isAutoEat: false,
    // 是否开启全自动吃肉，会自动进入肉帖自动吃肉
    isFullAutoEat: false,
    // 全自动吃肉是否无跳转通过iframe吃肉，否则直接当前页面跳转打开肉帖吃肉。
    isNewOpenIframe: false,
    // 是否立即吃肉：否则会有指定回复后才会吃
    isImmediatelyEat: false,
    // 帖子里是否显示用户等级
    isShowLevel: true,
    // 是否自动增加时长
    isAddOnlineDuration: false,
    // 刷新时间间隔
    timeInterval: 60,
    // 设置肉帖过期时间，过期前不会再自动吃肉
    expiredDays: 1,
    // 是否自动加载下一页
    isLoadNextPage: false,
    // 加载按钮方式: more / nextPage
    loadNextPageType: isMobile() ? "more" : "nextPage",
    // 一页最大的加载数量，超过数量就不会自动加载
    maxLoadNum: 150,
    // 滑块range最小和最大值
    minNumRange: 50,
    maxNumRange: 500,
    numStep: 50,
    // 设置悬浮按钮位置
    settingBtnLeft: 0,
    settingBtnTop: 0,
    // 按钮的响应试大小，单位vw，默认18vw
    settingIconResponsiveSize: 18,
    // 按钮最大的大小，单位px，默认100px
    settingIconMaxSize: 100,

    // 自动加载页面时是否执行尾部
    isExecTrail: true,
    // 滑块range间隔
    timeStep: 5,
    minTimeRange: 45,
    maxTimeRange: 120,
    // 是否增加发帖ubb
    isAddNewPostUBB: true,
    // 是否增加回帖ubb
    isAddReplyUBB: true,
    // 是否增加回帖表情
    isAddReplyFace: true,
    // 是否默认展开表情
    isUnfoldFace: false,
    // 是否默认展开表情
    isUnfoldUbb: false,
    // 是否自动上传到图床
    isUploadImage: false,
    // 上传图床token
    token: "",
  };
  let yaohuo_userData = null;
  // 数据初始化
  initSetting();

  let {
    isAutoEat,
    isFullAutoEat,
    isNewOpenIframe,
    isImmediatelyEat,
    isShowLevel,
    isAddOnlineDuration,
    timeInterval,
    expiredDays,
    isLoadNextPage,
    isExecTrail,

    timeStep,
    minTimeRange,
    maxTimeRange,

    maxLoadNum,
    minNumRange,
    maxNumRange,
    numStep,

    isShowSettingIcon,

    settingBtnLeft,
    settingBtnTop,

    settingIconMaxSize,
    settingIconResponsiveSize,

    isAddNewPostUBB,
    isAddReplyUBB,
    isAddReplyFace,
    isUnfoldFace,
    isUnfoldUbb,

    loadNextPageType,

    isUploadImage,
    token,
  } = yaohuo_userData;

  // 存储吃过肉的id，如果吃过肉则不会重复吃肉
  let autoEatList = getItem("autoEatList");
  // 回复页
  const viewPage = ["/bbs/book_re.aspx", "/bbs/book_view.aspx"];
  // 帖子列表页面
  const bbsPage = ["/bbs/book_list.aspx", "/bbs/list.aspx"];
  // 发帖
  const postPage = [
    "/bbs/book_view_add.aspx",
    "/bbs/book_view_sendmoney.aspx",
    "/bbs/book_view_addvote.aspx",
    "/bbs/book_view_addfile.aspx",
    "/bbs/book_view_mod.aspx",
  ];
  const loadNextPage = [
    /\/bbs\/book_re.aspx/,
    /\/bbs\/book_list.aspx/,
    /\/bbs\/list.aspx/,
    /\/bbs-.*\.html/,
  ];
  // 404
  const notFoundPage = ["/404.htm"];
  const faceList = [
    "踩.gif",
    "狂踩.gif",
    "淡定.gif",
    "囧.gif",
    "不要.gif",
    "重拳出击.gif",
    "砳砳.gif",
    "滑稽砳砳.gif",
    "沙发.gif",
    "汗.gif",
    "亲亲.gif",
    "太开心.gif",
    "酷.gif",
    "思考.gif",
    "发呆.gif",
    "得瑟.gif",
    "哈哈.gif",
    "泪流满面.gif",
    "放电.gif",
    "困.gif",
    "超人.gif",
    "害羞.gif",
    "呃.gif",
    "哇哦.gif",
    "要死了.gif",
    "谢谢.gif",
    "抓狂.gif",
    "无奈.gif",
    "不好笑.gif",
    "呦呵.gif",
    "感动.gif",
    "喜欢.gif",
    "疑问.gif",
    "委屈.gif",
    "你不行.gif",
    "流口水.gif",
    "潜水.gif",
    "咒骂.gif",
    "耶耶.gif",
    "被揍.gif",
    "抱走.gif",
  ];
  const diyFaceList = [
    {
      url: "https://i.ibb.co/hXBXGq8/jy.gif",
      name: "摸鱼",
    },
    {
      url: "https://i.ibb.co/L0scf9m/jw.gif",
      name: "稽舞",
    },
    {
      url: "https://i.ibb.co/rmQY19V/sj.gif",
      name: "色稽",
    },
    {
      url: "https://i.ibb.co/h14QP4d/jj.gif",
      name: "撒娇",
    },
    {
      url: "https://i.ibb.co/9yD4mFW/jg.gif",
      name: "稽狗",
    },
    {
      url: "https://i.ibb.co/CnNY1SG/mq.gif",
      name: "没钱",
    },
    {
      url: "https://i.ibb.co/0qTfStm/sw.gif",
      name: "骚舞",
    },
    {
      url: "https://i.ibb.co/yh8bSx7/cs.gif",
      name: "吃屎",
    },
    {
      url: "https://i.ibb.co/3BxqbXX/bs.gif",
      name: "鄙视",
    },
    {
      url: "https://i.ibb.co/3NrbQfQ/tg.gif",
      name: "听歌",
    },
    {
      url: "https://i.ibb.co/whDBFQd/st.gif",
      name: "伸头",
    },
    {
      url: "https://i.ibb.co/7KzRsmd/gz.gif",
      name: "鼓掌",
    },
    {
      url: "https://i.ibb.co/KNGfHFw/tt.gif",
      name: "踢腿",
    },
    {
      url: "https://i.ibb.co/sKS4R3x/nt.png",
      name: "男同",
    },
    {
      url: "https://i.ibb.co/VCWLFgz/sq.gif",
      name: "手枪",
    },
    {
      url: "https://i.ibb.co/pjw803c/pt.gif",
      name: "拍头",
    },
    {
      url: "https://i.ibb.co/fNcvwj0/tp.gif",
      name: "躺平",
    },
    {
      url: "https://i.ibb.co/5jJwwdQ/zj.gif",
      name: "追稽",
    },
    {
      url: "https://i.ibb.co/mRLMkyv/lsj.gif",
      name: "司稽",
    },
    {
      url: "https://i.ibb.co/7KKybVg/qt.gif",
      name: "乞讨",
    },
    {
      url: "https://i.ibb.co/3r8mtKh/gj.gif",
      name: "跪稽",
    },
    {
      url: "https://i.ibb.co/PWMFdB8/dn.gif",
      name: "刀你",
    },
    {
      url: "https://i.ibb.co/BcHh8kn/dp.gif",
      name: "冲刺",
    },
    {
      url: "https://i.ibb.co/LDycW8K/zq.gif",
      name: "转圈",
    },
    {
      url: "https://i.ibb.co/7gNd669/cj.gif",
      name: "吃稽",
    },
    {
      url: "https://i.ibb.co/7S2T2pF/fj.gif",
      name: "犯贱",
    },
    {
      url: "https://i.ibb.co/yFtQtLM/nb.gif",
      name: "牛掰",
    },
    {
      url: "https://i.ibb.co/FVnL0PB/yb.gif",
      name: "拥抱",
    },
    {
      url: "https://i.ibb.co/Nj0V2gM/722ee7ce0b4fdecd.gif",
      name: "拍头",
    },
    {
      url: "https://i.ibb.co/64Gmn3C/25e66a6595b1dc82.gif",
      name: "摇头",
    },
    {
      url: "https://i.ibb.co/2jWY20p/rt.gif",
      name: "挠头",
    },
    {
      url: "https://i.ibb.co/SdD7Vct/sx.gif",
      name: "上学",
    },
    {
      url: "https://i.ibb.co/dmng48J/lh.gif",
      name: "流汗",
    },
    {
      url: "https://i.ibb.co/GH0Q94V/5614974ef677a274.gif",
      name: "摩擦",
    },
  ];
  // 批量添加事件数组
  let addEventAry = [
    {
      id: "ubb_id",
      ubb: "[userid]",
      offset: 0,
    },
    {
      id: "ubb_ip",
      ubb: "[ip]",
      offset: 0,
    },
    {
      id: "ubb_url",
      ubb: "[url=网址]文字说明[/url]",
      offset: 6,
    },
    {
      id: "ubb_text",
      ubb: "[text]全角转半角：代码内容[/text]",
      offset: 7,
    },
    {
      id: "ubb_br",
      ubb: "///",
      offset: 0,
    },
    {
      id: "ubb_hr",
      ubb: "[hr]",
      offset: 0,
    },
    {
      id: "ubb_left",
      ubb: "[left]",
      offset: 0,
    },
    {
      id: "ubb_center",
      ubb: "[center]",
      offset: 0,
    },
    {
      id: "ubb_right",
      ubb: "[right]",
      offset: 0,
    },
    {
      id: "ubb_font",
      ubb: "[font=serif]输入文字[/font]",
      offset: 7,
    },
    {
      id: "ubb_b",
      ubb: "[b]加粗文字[/b]",
      offset: 4,
    },
    {
      id: "ubb_i",
      ubb: "[i]斜体文字[/i]",
      offset: 4,
    },
    {
      id: "ubb_u",
      ubb: "[u]下划线文字[/u]",
      offset: 4,
    },
    {
      id: "ubb_color",
      ubb: "[forecolor=red]颜色文字，默认红[/forecolor]",
      offset: 12,
    },
    {
      id: "ubb_random_color",
      ubb: "[forecolor=red]颜色文字，随机颜色[/forecolor]",
      offset: 12,
    },
    {
      id: "ubb_img",
      ubb: "[img]图片链接[/img]",
      offset: 6,
    },
    {
      id: "ubb_strike",
      ubb: "[strike]删除线文字[/strike]",
      offset: 9,
    },
    {
      id: "ubb_call",
      ubb: "[call]拨号手机号码[/call]",
      offset: 7,
    },
    {
      id: "ubb_sms",
      ubb: "[url=sms:手机号码?body=短信内容]点此发送[/url]",
      offset: 0,
    },
    {
      id: "ubb_now",
      ubb: "当前系统日期和时间：[now]",
      offset: 0,
    },
    {
      id: "ubb_codo",
      ubb: "倒计天：[codo]2030-01-01[/codo]",
      offset: 7,
    },
    {
      id: "ubb_audio",
      ubb: "[audio=X]音频直链地址[/audio]",
      offset: 8,
    },
    {
      id: "ubb_movie",
      ubb: "[movie=100%*100%]视频直链地址|封面图片地址[/movie]",
      offset: 8,
    },
    {
      id: "ubb_nzgsa",
      ubb: "[audio=X]https://file.uhsea.com/2304/3deb45e90564252bf281f47c7b47a153KJ.mp3[/audio]",
      offset: 0,
    },
  ];

  let timer = null;

  // 是否点击加载更多
  let isClickLoadMoreBtn = false;
  // 是否是新页面
  let isNewPage = false;

  const spanstyle =
    "color: #fff; padding: 2px 4px; font-size: 14px; background-color: #ccc;border-radius: 10%;";
  const a2style =
    "color: #fff; padding: 2px 4px; font-size: 14px; background-color: #d19275;border-radius: 10%;";
  const a3style =
    "color: #fff; padding: 2px 4px; font-size: 14px; background-color: #66ccff;border-radius: 10%;";
  // ==主代码执行==
  (function () {
    // 处理浏览器滚动条事件
    handleWindowScroll();
    // 处理窗口改变事件
    handleWindowResize();
    // 添加站内设置按钮
    addSettingBtn();
    // 如果关闭了悬浮图标，在网站首页右上角添加插件设置入口
    handleAddSettingText();
    // 注册油猴脚本设置
    handleRegisterMenu();
    // 加载更多按钮点击事件监听
    handleAddLoadMoreBtnClick();
    // 手动吃肉：手动进入肉帖吃
    handleAutoEat();
    // 全自动吃肉：自动进入肉帖自动吃
    handleFullAutoEat();
    // 增加回帖ubb
    handleAddReplyUBB();
    // 增加回帖表情
    handleAddReplyFace();
    // 优化回帖
    handleReply();
    // 回帖增加随机颜色
    handleAddReplyRandomColor();
    // 自动上传图床功能
    handleUploadImage();
    // 增加发帖ubb
    handleAddNewPostUBB();
    // 显示用户等级
    handleShowUserLevel();
    // 处理404页面跳回新帖页面
    handleNotFoundPage();
  })();

  // ==其他功能函数和方法==
  function handleAddSettingText() {
    // 修改pc端滚动条样式
    if (!isMobile()) {
      MY_addStyle(`
        /*滚动条整体样式*/
        /*高宽分别对应横竖滚动条的尺寸*/
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
          background-color: #F5F5F5;
        }
        /*定义滚动条轨道 内阴影+圆角*/
        ::-webkit-scrollbar-track
        {
          box-shadow: inset 0 0 6px rgba(0,0,0,0.1);
          border-radius: 3px;
          background-color: #F5F5F5;
        }
        /*滚动条里面小方块*/
        ::-webkit-scrollbar-thumb {
          /* height: 50px; */
          border-radius:3px;
          box-shadow: inset 0 0 6px rgba(0,0,0,.3);
          background-color: #b8b8b8;
        }
        ::-webkit-scrollbar-thumb:hover {
          /* height: 50px; */
          background-color: #878987;
          border-radius: 6px
        }
      `);
    }

    if (!isShowSettingIcon && $(".top2").length) {
      $(".top2").append(
        `<a class="yaohuo-setting-text" style="float:right;cursor: pointer;">插件设置</a>`
      );

      $(".yaohuo-setting-text").click(() => {
        setMenu();
      });
    }
  }
  function handleRegisterMenu() {
    try {
      if (!!GM_registerMenuCommand) {
        GM_registerMenuCommand("打开设置界面", setMenu);
      }
    } catch (error) {}
  }
  function isMobile() {
    return /Mobile/i.test(navigator.userAgent);
  }
  function initSetting() {
    // 在移动设备上执行的代码
    if (isMobile()) {
      // 移动端默认显示站内设置图标
      settingData.isShowSettingIcon = true;
    } else {
      // 在桌面设备上执行的代码
    }

    // 获取用户历史数据
    yaohuo_userData = MY_getValue("yaohuo_userData");

    // 查看本地是否存在旧数据
    if (!yaohuo_userData) {
      yaohuo_userData = settingData;
      // MY_setValue("yaohuo_userData", yaohuo_userData);
    }

    // 自动更新数据
    for (let value in settingData) {
      if (!yaohuo_userData.hasOwnProperty(value)) {
        yaohuo_userData[value] = settingData[value];
        MY_setValue("yaohuo_userData", yaohuo_userData);
      }
    }

    initSettingBtnPosition("init");
  }
  // 更新按钮位置到最右边
  /**
   * 当按钮靠最右边时，设置按钮的left偏移
   * @param {'init' | 'update'} type type值为init / update
   */
  function initSettingBtnPosition(type = "update") {
    let { settingBtnTop, settingIconResponsiveSize, settingIconMaxSize } =
      yaohuo_userData;
    let newLeft;

    // btn最大100px，根据屏幕视口取18vw
    newLeft = Math.floor(
      window.innerWidth -
        Math.min(
          (window.innerWidth / 100) * settingIconResponsiveSize,
          settingIconMaxSize
        )
    );
    if (type === "update") {
      const floatingDiv = $("#floating-setting-btn")[0];
      floatingDiv.style.left = newLeft + "px";
    }
    saveSettingBtnPosition({ left: newLeft, top: settingBtnTop });
  }
  /**
   * 保存设置按钮的位置
   * @param {Object} pos - 按钮位置信息
   * @param {number} pos.left - 按钮左边距
   * @param {number} pos.top - 按钮上边距
   */
  function saveSettingBtnPosition({ left, top }) {
    yaohuo_userData.settingBtnLeft = left;
    yaohuo_userData.settingBtnTop = top;

    setItem("yaohuo_userData", yaohuo_userData);
  }

  function addSettingBtn() {
    if ($("#floating-setting-btn").length) {
      return;
    }

    MY_addStyle(`
      #floating-setting-btn {
        display: ${isShowSettingIcon ? "block" : "none"};
        max-width: ${settingIconMaxSize}px;
        max-height: ${settingIconMaxSize}px;
        width: ${settingIconResponsiveSize}vw;
        height: ${settingIconResponsiveSize}vw;
        user-select: none;
        box-sizing: border-box;
        position: fixed;
        z-index: 999;
        cursor: move;
        background-repeat: no-repeat;
        background-position: center;
      }
      #floating-setting-btn svg {
        width: 100%;
        height: 100%;
        opacity: 0.6;
        filter: drop-shadow(0px 0px 3px #666);
      }
      .overflow-hidden-scroll {
        overflow: hidden !important;
      }
      .touch-action-none {
        touch-action: none;
      }
      .add-position-static{
        position: static !important;
      }
    `);

    let innerH = `
      <div id="floating-setting-btn" style="top: ${settingBtnTop}px;
        left: ${settingBtnLeft}px;">
        </svg>
        <svg
          t="1681624380345"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="11281"
          width="80"
          height="80"
        >
          <path
            d="M761.472 978.944H253.696c-115.328 0-208.768-93.44-208.768-208.768V262.528C45.056 147.2 138.496 53.76 253.696 53.76h507.776C876.8 53.76 970.24 147.2 970.24 262.528v507.776c0 115.2-93.44 208.64-208.768 208.64z"
            fill="#89898F"
            p-id="11282"
          ></path>
          <path
            d="M602.368 513.408h-189.44C334.208 513.408 270.08 449.28 270.08 370.56S334.208 227.84 412.928 227.84h189.44c78.72 0 142.848 64.128 142.848 142.848s-64.128 142.72-142.848 142.72z m-189.44-262.272c-65.92 0-119.552 53.632-119.552 119.552s53.632 119.552 119.552 119.552h189.44c65.92 0 119.552-53.632 119.552-119.552s-53.632-119.552-119.552-119.552h-189.44zM611.072 804.864H404.224c-72.448 0-131.2-58.752-131.2-131.2s58.752-131.2 131.2-131.2h206.976c72.448 0 131.2 58.752 131.2 131.2-0.128 72.576-58.88 131.2-131.328 131.2z"
            fill="#FFFFFF"
            p-id="11283"
          ></path>
          <path
            d="M417.28 370.56m-80.128 0a80.128 80.128 0 1 0 160.256 0 80.128 80.128 0 1 0-160.256 0Z"
            fill="#FFFFFF"
            p-id="11284"
          ></path>
          <path
            d="M619.392 673.792m-80.128 0a80.128 80.128 0 1 0 160.256 0 80.128 80.128 0 1 0-160.256 0Z"
            fill="#89898F"
            p-id="11285"
          ></path>
        </svg>
      </div>
    `;
    $("body").append(innerH);

    const floatingDiv = $("#floating-setting-btn")[0];

    let mouseOffsetX = 0;
    let mouseOffsetY = 0;
    let isDragging = false;
    let dragThreshold = 5; // 拖动阈值，即鼠标移动的距离超过多少像素才开始拖动
    let clickThreshold = 500; // 点击阈值，即鼠标按下的时间不超过多少毫秒才算是点击

    let mouseDownTime; // 鼠标按下的时间
    let mouseDownX; // 鼠标按下的位置
    let mouseDownY;

    // 鼠标事件
    floatingDiv.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", throttle(onMouseMove, 15));
    document.addEventListener("mouseup", onMouseUp);

    // 触摸事件
    floatingDiv.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", throttle(onTouchMove, 5));
    document.addEventListener("touchend", onTouchEnd);

    // 鼠标事件监听器
    function onMouseDown(e) {
      floatingDiv.style.transition = "unset";

      // 记录鼠标按下的时间和位置
      mouseDownTime = new Date().getTime();
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;

      // 鼠标相对于拖动图标的偏移x和y距离
      mouseOffsetX = e.clientX - floatingDiv.offsetLeft;
      mouseOffsetY = e.clientY - floatingDiv.offsetTop;
      isDragging = true;

      e.preventDefault();
      e.stopPropagation();
    }

    function onMouseMove(e) {
      if (!isDragging) {
        return;
      }

      const left = e.clientX - mouseOffsetX;
      const top = e.clientY - mouseOffsetY;

      const maxLeft = window.innerWidth - floatingDiv.offsetWidth;
      const maxTop = window.innerHeight - floatingDiv.offsetHeight;

      floatingDiv.style.left = Math.min(Math.max(0, left), maxLeft) + "px";
      floatingDiv.style.top = Math.min(Math.max(0, top), maxTop) + "px";
    }

    function onMouseUp(e) {
      if (!isDragging) {
        return;
      }

      // 拖动结束重置数据
      mouseOffsetX = 0;
      mouseOffsetY = 0;
      isDragging = false;

      // 如果按下的时间不够长，则认为是点击事件
      // 如果移动的距离

      let distanceX = Math.abs(e.clientX - mouseDownX);
      let distanceY = Math.abs(e.clientY - mouseDownY);
      // 计算鼠标点击的时间小于500ms，并且移动的距离少于5像素则认为时点击事件
      if (
        new Date().getTime() - mouseDownTime < clickThreshold &&
        distanceX < dragThreshold &&
        distanceY < dragThreshold
      ) {
        setMenu();
        return;
      }

      // 拖动按钮自动靠边处理
      let newLeft;
      let position = floatingDiv.getBoundingClientRect();
      // 如果左边比右边多就靠左，否则靠右
      if (window.innerWidth - position.right > position.left) {
        newLeft = 0;
      } else {
        newLeft = window.innerWidth - position.width;
      }

      floatingDiv.style.left = newLeft + "px";
      floatingDiv.style.transition = "all 0.2s ease-in-out";

      // 更新悬浮图标位置信息
      saveSettingBtnPosition({ top: position.top, left: newLeft });
    }

    // 触摸事件监听器
    function onTouchStart(e) {
      floatingDiv.style.transition = "unset";

      // 记录鼠标按下的时间和位置
      mouseDownTime = new Date().getTime();

      mouseDownX = e.touches[0].clientX;
      mouseDownY = e.touches[0].clientY;

      mouseOffsetX = e.touches[0].clientX - floatingDiv.offsetLeft;
      mouseOffsetY = e.touches[0].clientY - floatingDiv.offsetTop;
      isDragging = true;

      e.preventDefault();
      e.stopPropagation();

      $("body").addClass("touch-action-none");
      $("body").addClass("overflow-hidden-scroll");
    }

    function onTouchMove(e) {
      if (!isDragging) {
        return;
      }

      const left = e.touches[0].clientX - mouseOffsetX;
      const top = e.touches[0].clientY - mouseOffsetY;

      const maxLeft = window.innerWidth - floatingDiv.offsetWidth;
      const maxTop = window.innerHeight - floatingDiv.offsetHeight;

      floatingDiv.style.left = Math.min(Math.max(0, left), maxLeft) + "px";
      floatingDiv.style.top = Math.min(Math.max(0, top), maxTop) + "px";
    }

    function onTouchEnd(e) {
      if (!isDragging) {
        return;
      }
      $("body").removeClass("touch-action-none");
      $("body").removeClass("overflow-hidden-scroll");

      // 拖动结束重置数据
      mouseOffsetX = 0;
      mouseOffsetY = 0;
      isDragging = false;

      // 如果按下的时间不够长，则认为是点击事件
      // 如果移动的距离
      let touch = e.changedTouches[0];
      let clientX = touch.clientX;
      let clientY = touch.clientY;

      let distanceX = Math.abs(clientX - mouseDownX);
      let distanceY = Math.abs(clientY - mouseDownY);

      // 计算鼠标点击的时间小于500ms，并且移动的距离少于5像素则认为时点击事件
      if (
        new Date().getTime() - mouseDownTime < clickThreshold &&
        distanceX < dragThreshold &&
        distanceY < dragThreshold
      ) {
        setMenu();
        return;
      }

      // 拖动按钮自动靠边处理
      let newLeft;
      let position = floatingDiv.getBoundingClientRect();
      // 如果左边比右边多就靠左，否则靠右
      if (window.innerWidth - position.right > position.left) {
        newLeft = 0;
      } else {
        newLeft = window.innerWidth - position.width;
      }
      floatingDiv.style.left = newLeft + "px";
      floatingDiv.style.transition = "all 0.2s ease-in-out";

      // 更新悬浮图标位置信息
      saveSettingBtnPosition({ top: position.top, left: newLeft });
    }
  }
  // 处理窗口改变事件
  function handleWindowResize() {
    // 窗口改变重新计算悬浮按钮的位置
    window.addEventListener("resize", function (e) {
      let { settingBtnLeft } = yaohuo_userData;

      if (settingBtnLeft !== 0) {
        initSettingBtnPosition("update");
      }
    });
  }
  function setMenu() {
    // 避免重复添加
    if ($(".yaohuo-modal-mask").length) {
      return;
    }
    MY_addStyle(`
      .yaohuo-modal-mask {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 1000;
        height: 100%;
        width: 100%;
        background-color: rgba(0, 0, 0, 0.45);
      }
      .yaohuo-wrap {
        padding: 20px 0;
        box-sizing: border-box;
        position: relative;
        margin: 0 auto;
        background: #fff;
        border-radius: 12px;
        top: 10%;
        width: 400px;
        max-width: 95vw;
        user-select: none;
      }
      .yaohuo-wrap header {
        padding: 0 20px;
        color: rgba(0, 0, 0, 0.88);
        font-weight: 600;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 8px;
      }
      .yaohuo-wrap footer {
        font-size: 0px;
        text-align: right;
        margin-top: 10px;
        padding: 0 20px;
      }
      .yaohuo-wrap footer button {
        font-size: 14px;
        height: 32px;
        padding: 4px 15px;
        border-radius: 6px;
        border: 1px solid transparent;
        cursor: pointer;
      }
      .yaohuo-wrap footer .cancel-btn {
        background-color: #fff;
        border-color: #d9d9d9;
        margin-right: 8px;
        box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
      }
      .yaohuo-wrap footer .ok-btn {
        color: #fff;
        background-color: #1677ff;
        box-shadow: 0 2px 0 rgba(5, 145, 255, 0.1);
      }
      .yaohuo-wrap ul {
        margin: 0;
        padding: 0 10px 0 20px;
        margin-right: 7px;
        max-height: 65vh;
        overflow: auto;
      }
      /* 设置滚动条的宽度和高度 */
      .yaohuo-wrap ::-webkit-scrollbar {
        width: 3px;
      }

      /* 设置滚动条滑块的背景色 */
      .yaohuo-wrap ::-webkit-scrollbar-thumb {
        background-color: #999;
        border-radius:10px;
      }
      .yaohuo-wrap i {
        font-style: normal;
      }
      .yaohuo-wrap li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 44px;
      }
      .yaohuo-wrap li input[type="range"] {
        width: 130px;
        height: 1px;
        appearance: auto;
        border: none;
        padding: 0;
      }
      .yaohuo-wrap li select {
        height: 28px;
        line-height: 28px;
        font-size: 14px;
        width: 130px;
        border: 1px solid #5c5c5c;
        border-radius: 5px;
        text-align: center;
        outline: 0;
      }

      .yaohuo-wrap .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 30px;
      }

      .yaohuo-wrap .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .yaohuo-wrap .password-container{
        width: 60%;
        position: relative;
      }

      .password-container .toggle-password {
        position: absolute;
        top: 52%;
        right: 6px;
        transform: translateY(-50%);
        cursor: pointer;
      }

      .yaohuo-wrap li .password-container input {
        width: 100%;
        box-sizing: border-box;
        height: 32px;
        padding-right: 28px;
      }

      .yaohuo-wrap .switch label {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        -webkit-transition: 0.4s;
        transition: 0.4s;
        border-radius: 34px;
      }

      .yaohuo-wrap .switch label::before {
        position: absolute;
        content: "";
        height: 22px;
        width: 22px;
        left: 6px;
        bottom: 4px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
      }

      .yaohuo-wrap .switch input:checked + label {
        background-color: #2196f3;
      }

      .yaohuo-wrap .switch input:checked + label::before {
        transform: translateX(26px);
      }
      .yaohuo-wrap hr{
        margin-bottom: 5px;
        margin-top: 5px;
      }
    `);
    let innerH = `
      <div class="yaohuo-modal-mask">
        <div class="yaohuo-wrap">
          <header>🔥拓展增强🔥妖火插件设置</header>
          <ul>
            <li>
              <span>显示站内设置图标</span>
              <div class="switch">
                <input type="checkbox" id="isShowSettingIcon" data-key="isShowSettingIcon" />
                <label for="isShowSettingIcon"></label>
              </div>
            </li>
            <li>
              <span>设置图标大小：<i class="range-num">${settingIconMaxSize}</i>px</span>
              <input
                type="range"
                id="settingIconMaxSize"
                data-key="settingIconMaxSize"
                min="${40}"
                value="${settingIconMaxSize}"
                max="${100}"
                step="${5}"
              />
            </li>
            <hr>
            <li>
              <span>自动上传图床</span>
              <div class="switch">
                <input type="checkbox" id="isUploadImage" data-key="isUploadImage" />
                <label for="isUploadImage"></label>
              </div>
            </li>
            <li>
              <span>图床token</span>
              <div class="password-container">
                <input 
                  type="password" 
                  placeholder="为空则为游客上传"
                  id="token" 
                  data-key="token"
                  value="${token}"
                />
                <svg
                  viewBox="64 64 896 896"
                  focusable="false"
                  data-icon="eye"
                  width="20px"
                  height="20px"
                  fill="currentColor"
                  aria-hidden="true"
                  class="toggle-password"
                >
                  <path
                    d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 0 0 0 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z"
                  ></path>
                </svg>
              </div>
            </li>
            <hr>
            <li>
              <span>手动进贴吃肉</span>
              <div class="switch">
                <input type="checkbox" id="isAutoEat" data-key="isAutoEat" />
                <label for="isAutoEat"></label>
              </div>
            </li>
            <li>
              <span>自动进贴全自动吃肉</span>
              <div class="switch">
                <input type="checkbox" id="isFullAutoEat" data-key="isFullAutoEat" />
                <label for="isFullAutoEat"></label>
              </div>
            </li>
            <li>
              <span>全自动吃肉是否无跳转</span>
              <div class="switch">
                <input type="checkbox" id="isNewOpenIframe" data-key="isNewOpenIframe" />
                <label for="isNewOpenIframe"></label>
              </div>
            </li>
            <li>
              <span>立刻吃肉</span>
              <div class="switch">
                <input type="checkbox" id="isImmediatelyEat" data-key="isImmediatelyEat" />
                <label for="isImmediatelyEat"></label>
              </div>
            </li>
            <li>
              <span>肉帖过期时间：<i class="range-num">${expiredDays}</i>天</span>
              <input
                type="range"
                id="expiredDays"
                data-key="expiredDays"
                min="${1}"
                value="${expiredDays}"
                max="${7}"
                step="${1}"
              />
            </li>
            <li>
              <span>自动吃肉时间间隔：<i class="range-num">${timeInterval}</i>秒</span>
              <input
                type="range"
                id="timeInterval"
                data-key="timeInterval"
                min="${minTimeRange}"
                value="${timeInterval}"
                max="${maxTimeRange}"
                step="${timeStep}"
              />
            </li>
            <hr>
            <li>
              <span>回帖表情增强</span>
              <div class="switch">
                <input type="checkbox" id="isAddReplyFace" data-key="isAddReplyFace" />
                <label for="isAddReplyFace"></label>
              </div>
            </li>
            <li>
              <span>回帖表情默认展开</span>
              <div class="switch">
                <input type="checkbox" id="isUnfoldFace" data-key="isUnfoldFace" />
                <label for="isUnfoldFace"></label>
              </div>
            </li>
            <hr>
            <li>
              <span>回帖UBB增强</span>
              <div class="switch">
                <input type="checkbox" id="isAddReplyUBB" data-key="isAddReplyUBB" />
                <label for="isAddReplyUBB"></label>
              </div>
            </li>
            <li>
              <span>回帖UBB默认展开</span>
              <div class="switch">
                <input type="checkbox" id="isUnfoldUbb" data-key="isUnfoldUbb" />
                <label for="isUnfoldUbb"></label>
              </div>
            </li>
            <hr>
            <li>
              <span>发帖UBB增强</span>
              <div class="switch">
                <input type="checkbox" id="isAddNewPostUBB" data-key="isAddNewPostUBB" />
                <label for="isAddNewPostUBB"></label>
              </div>
            </li>
            <hr>
            <li>
              <span>自动加载下一页</span>
              <div class="switch">
                <input type="checkbox" id="isLoadNextPage" data-key="isLoadNextPage" />
                <label for="isLoadNextPage"></label>
              </div>
            </li>
            <li>
              <span>自动加载下一页方式</span>
              <select data-key="loadNextPageType" id="loadNextPageType">
                <option value="more">加载更多按钮</option>
                <option value="nextPage">下一页按钮</option>
              </select>
            </li>
            <li>
              <span>自动加载最大数：<i class="range-num">${maxLoadNum}</i>个</span>
              <input
                id="maxLoadNum"
                type="range"
                data-key="maxLoadNum"
                min="${minNumRange}"
                value="${maxLoadNum}"
                max="${maxNumRange}"
                step="${numStep}"
              />
            </li>
            <hr>
            <li>
              <span>贴子显示等级</span>
              <div class="switch">
                <input type="checkbox" id="isShowLevel" data-key="isShowLevel" />
                <label for="isShowLevel"></label>
              </div>
            </li>
          </ul>
          <footer>
            <button class="cancel-btn">取消</button>
            <button class="ok-btn">确认</button>
          </footer>
        </div>
      </div>
    `;
    $("body").append(innerH).addClass("overflow-hidden-scroll");

    $(".yaohuo-modal-mask").show();

    setSettingInputEvent("edit");

    $(".cancel-btn").click(handleCancelBtn);
    $(".ok-btn").click(handleOkBtn);
  }
  /**
   * 设置设置菜单，点击设置打开菜单，并且回显数据，保存则保存数据
   * @param {"edit" | 'save'} status edit和save两种模式
   */
  function setSettingInputEvent(status = "edit") {
    $(".yaohuo-wrap input, .yaohuo-wrap select").each((index, item) => {
      let type = item.type;
      let dataKey = item.getAttribute("data-key");
      switch (type) {
        case "checkbox":
          if (status === "edit") {
            item.checked = getValue(dataKey) ? true : false;
            // 根据当前的按钮选中状态处理子项的联动显示或隐藏
            autoShowElement({
              fatherIdAry: ["isShowSettingIcon"],
              childIdAry: ["settingIconMaxSize"],
              dataKey,
            });
            autoShowElement({
              fatherIdAry: ["isLoadNextPage"],
              childIdAry: ["loadNextPageType", "maxLoadNum"],
              dataKey,
            });
            autoShowElement({
              fatherIdAry: ["isFullAutoEat"],
              childIdAry: [
                "timeInterval",
                "isNewOpenIframe",
                "isImmediatelyEat",
              ],
              dataKey,
            });
            autoShowElement({
              fatherIdAry: ["isAutoEat", "isFullAutoEat"],
              childIdAry: ["expiredDays"],
              dataKey,
            });
            autoShowElement({
              fatherIdAry: ["isUploadImage"],
              childIdAry: ["token"],
              dataKey,
            });
            autoShowElement({
              fatherIdAry: ["isAddReplyUBB"],
              childIdAry: ["isUnfoldUbb"],
              dataKey,
            });
            autoShowElement({
              fatherIdAry: ["isAddReplyFace"],
              childIdAry: ["isUnfoldFace"],
              dataKey,
            });
          } else {
            setValue(dataKey, item.checked);
          }
          break;

        case "range":
          if (status === "edit") {
            $(item).on("input propertychange", function (event) {
              $(item).prev().children(".range-num").text(item.value);
            });
          } else {
            setValue(dataKey, parseInt(item.value));
          }
          break;

        case "select-one":
          if (status === "edit") {
            item.value = getValue(dataKey);
            $(item).on("change", function (event) {
              $(item).prev().children(".range-num").text(item.value);
            });
          } else {
            setValue(dataKey, item.value);
          }
          break;

        case "number":
          if (status === "edit") {
            item.value = getValue(dataKey);
          } else {
            setValue(dataKey, item.value);
          }
          break;

        case "password":
          if (status === "edit") {
            item.value = getValue(dataKey, "");
            $(item)
              .next()
              .on("click", function (event) {
                item.type = item.type === "password" ? "text" : "password";
              });
          } else {
            setValue(dataKey, item.value);
          }
          break;

        default:
          if (status === "edit") {
            item.value = getValue(dataKey, "");
          } else {
            setValue(dataKey, item.value);
          }
          break;
      }
    });

    /**
     * 根据当前的选中状态处理子项的显示或隐藏
     * @param {Object} options - 选项对象
     * @param {Array<string>} options.fatherIdAry - 包含父元素ID的字符串数组
     * @param {Array<string>} options.childId - 子元素的ID
     * @param {string} options.dataKey - 存储在父元素上的数据键名
     */
    function autoShowElement({ fatherIdAry, childIdAry, dataKey }) {
      execFn();
      fatherIdAry.forEach((item) => {
        $(`#${item}`).on("change", function (event) {
          execFn();
        });
      });
      function execFn() {
        if (fatherIdAry.includes(dataKey)) {
          childIdAry.forEach((childId) => {
            let parent = $(`#${childId}`).parent();
            parent = parent.prop("tagName") === "LI" ? parent : parent.parent();

            let isShow = fatherIdAry.some((item) =>
              $(`#${item}`).prop("checked")
            );
            isShow ? parent.show() : parent.hide();
          });
        }
      }
    }
  }
  function handleCancelBtn() {
    $("body").removeClass("overflow-hidden-scroll");
    $(".yaohuo-modal-mask").remove();
  }
  function handleOkBtn() {
    setSettingInputEvent("save");
    $("body").removeClass("overflow-hidden-scroll");
    $(".yaohuo-modal-mask").hide();
    MY_setValue("yaohuo_userData", yaohuo_userData);
    if (!yaohuo_userData.isShowSettingIcon) {
      $("#floating-setting-btn").hide();
    } else {
      $("#floating-setting-btn").show();
    }
    // 刷新页面
    setTimeout(function () {
      window.location.reload();
    }, 300);
  }

  // 全自动吃肉：自动进入肉帖自动吃
  function handleFullAutoEat() {
    if (bbsPage.includes(window.location.pathname)) {
      if (isFullAutoEat) {
        // 定时刷新页面
        if (!isAddOnlineDuration && !timer) {
          timer = setInterval(function () {
            location.reload();
          }, timeInterval * 1000);
        }
        // 指定时间不自动吃肉
        if (new Date().getHours() < 7) {
          console.log("当前小于8点，不吃肉");
          return;
        }
        let eatImgSrc = "/NetImages/li.gif";

        let eatList = document.querySelectorAll(`img[src='${eatImgSrc}']`);
        let randomNum = getRandomNumber(0, 20);

        for (let index = 0; index < eatList.length; index++) {
          const element = eatList[index];
          // 拿到肉帖dom
          let parent = element.parentElement;
          let bbs = parent.querySelector("a[href^='/bbs-']");
          let replyNum = parent.querySelector(
            "a[href^='/bbs/book_re.aspx']"
          ).innerHTML;
          let href = bbs.getAttribute("href");
          // 肉帖标识
          let id = href.match(/bbs-(\d+)/)[1];

          // 新的url，用于区分自动打开的肉帖和手动打开的肉帖
          let newHref = href.includes(".html?")
            ? `${href}&open=new`
            : `${href}?open=new`;
          /**
           * 只吃没吃过的肉帖
           * 吃过的肉帖在肉帖过期时间内不会再吃
           * 吃完的肉帖在记录里的也不会再吃
           *
           * 1.吃肉方式默认当前窗口打开
           * 2.新开窗口打开通过iframe
           */
          let autoEatList = getItem("autoEatList");
          // 回帖小于8个暂缓吃肉
          // if (!isImmediatelyEat && replyNum <= randomNum) {
          //   console.log(`回帖小于${randomNum}个暂缓吃肉:${id}`);
          //   continue;
          // }

          if (!autoEatList[id]) {
            if (isNewOpenIframe) {
              // 新窗口
              setTimeout(() => {
                // 不通过window.open方式吃肉，无法设置静默状态
                // 无法保持原窗口焦点 打开新窗口。会影响其他窗口页面
                // 创建一个 iframe 元素
                let iframe = document.createElement("iframe");

                // 设置 iframe 的属性
                iframe.src = newHref;
                iframe.style.display = "none";
                document.body.appendChild(iframe);
              }, (index + 1) * 1000);
            } else {
              bbs.href = newHref;
              bbs.click();
              break;
            }
          } else {
            console.log("无需跳转进肉帖，已经吃过肉:", id);
          }
        }
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
  // 浏览器scroll事件
  function handleWindowScroll() {
    window.addEventListener(
      "scroll",
      throttle(() => {
        let isPage = loadNextPage.some((item) =>
          item.test(window.location.pathname)
        );

        // 处理点击加载更多后的全自动吃肉
        if (isPage) {
          let nextBtn = null;
          // 下一页按钮的父节点
          let nextPageWrap = document.querySelector(".bt2");

          if (loadNextPageType === "more" || !nextPageWrap) {
            // 加载更多加载下一页
            nextBtn = document.querySelector("span[id$=show_tip]");

            // 已经请求到数据
            if (nextBtn?.innerText.includes("加载更多")) {
              // 加载完成了
              isNewPage = true;

              // 开始自动吃肉
              if (isClickLoadMoreBtn && isNewPage) {
                // 滚动时加载新页的时候自动吃肉
                handleFullAutoEat();
              }

              isClickLoadMoreBtn = false;
              isNewPage = false;

              // 处理自动加载更多，需要放到最后
              handleLoadNextPage();
            }
          } else {
            // 下一页按钮加载下一页

            nextBtn = nextPageWrap.firstChild;

            handleLoadNextPage();
          }
        }
      }, 100)
    );
  }
  // 返回当前列表数据的长度
  function getListLength() {
    let length = 0;
    if ($(".listdata").length) {
      length = $(".listdata").length;
    } else {
      length = $(".reline").length + $(".list-reply").length;
    }
    return length;
  }
  // 自动吃肉：手动进入肉帖自动吃
  function handleAutoEat() {
    if (
      /^\/bbs-.*\.html$/.test(window.location.pathname) &&
      (isAutoEat || isFullAutoEat)
    ) {
      const form = document.getElementsByName("f")[0];
      let isAutoEatBbs = window.location.search.includes("open=new");
      if (!form) {
        // 如果是自动吃肉的则直接返回，并记录不可吃肉
        if (isAutoEatBbs) {
          autoEatCallback();
        }
        return;
      }
      const face = form.getElementsByTagName("select")[0];
      const replyBtn = document.getElementsByName("g")[0];

      const textarea = document.querySelector(".retextarea");
      // 帖子标识id
      let id = window.location.pathname.match(/\d+/)[0];

      // 吃肉 必须放在后面
      const fileTag = document.querySelector(
        "a[href^='/bbs/book_re_addfile.aspx']"
      );
      let eatMeat = document.createElement("input");
      eatMeat.style.float = "right";
      eatMeat.type = "submit";
      eatMeat.value = "一键吃肉";
      eatMeat.addEventListener("click", (e) => {
        e.preventDefault();
        let eatWordsArr = [
          "吃",
          "吃吃",
          "吃吃.",
          "吃吃。",
          "吃吃..",
          "吃吃。。",
          "吃了",
          "吃肉",
          "来吃肉",
          "吃.",
          "吃。",
          "吃了.",
          "吃了。",
          "吃肉.",
          "吃肉。",
          "来吃肉.",
          "来吃肉。",
          "吃..",
          "吃。。",
          "吃了..",
          "吃了。。",
          "吃肉..",
          "吃肉。。",
          "来吃肉..",
          "来吃肉。。",
          "口乞了",
          "口乞了.",
          "口乞了。",
          "口乞肉",
          "口乞肉.",
          "口乞肉。",
          "口乞..",
          "口乞。。",
          "chile..",
          "chile。。",
          "7肉..",
          "7肉。。",
          "7了..",
          "7了。。",
          "肉肉肉",
          "肉肉肉.",
          "肉肉肉。",
          "肉肉肉..",
          "肉肉肉。。",
          "先吃肉",
          "先吃肉.",
          "先吃肉。",
          "先吃肉..",
          "先吃肉。。",
        ];

        let index = Math.floor(Math.random() * eatWordsArr.length);
        console.log("吃肉回复：", eatWordsArr[index]);

        // 随机添加表情
        // const randomNum = Math.floor(Math.random() * faceList.length);
        // const isAddFaceEatMeat = Math.random() < 0.5;
        // if (isAddFaceEatMeat) {
        //   face.value = faceList[randomNum];
        // }

        insertText(textarea, eatWordsArr[index], 0);
        replyBtn.click();
        autoEatCallback();
      });

      // 添加事件监听，如果吃过肉则会提示
      replyBtn.addEventListener(
        "click",
        (e) => {
          if (autoEatList[id] && !confirm("当前已经吃过肉，是否继续回复")) {
            // 取消提交
            textarea.value = "";
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );

      const meatTag = document.querySelector("span.yushuzi");

      if (!isAutoEat && !isFullAutoEat) {
        console.log("未开启自动吃肉，可在编辑脚本进行开启");
      } else {
        if (meatTag == undefined) {
          console.log("非肉勿7");
          // autoEatCallback();
        } else if (parseInt(meatTag.innerHTML) <= 0) {
          console.log("无肉怎7");
          // 把无肉帖添加进去
          autoEatCallback();
        } else {
          const meiRenShuZi =
            document.querySelector("span.meirenshuzi").innerHTML;
          const total = document.querySelector("span.lijinshuzi").innerHTML;

          // 总次数
          let totalCounter = Math.ceil(parseInt(total) / parseInt(meiRenShuZi));
          // 使用次数
          let usageCounter =
            (total - parseInt(meatTag.innerHTML)) / parseInt(meiRenShuZi);
          // 剩余次数
          let residueCounter = totalCounter - usageCounter;

          let autoEatList = getItem("autoEatList");

          if (!autoEatList[id]) {
            // 使用次数>=20、剩余次数少于10、立即吃肉、不是自动吃肉的帖子、手机端（不支持iframe吃肉）满足这些条件才直接吃肉
            if (
              isImmediatelyEat ||
              usageCounter > 20 ||
              residueCounter <= 10 ||
              !isAutoEatBbs ||
              isMobile()
            ) {
              console.log("有肉快7");
              eatMeat.click();
            } else {
              console.log(
                `总次数：${totalCounter}，已吃次数：${usageCounter}，剩余次数${residueCounter}`,
                "当前次数<=20或者剩余次数>10暂时不吃"
              );
              autoEatCallback(false);
            }
          } else {
            console.log("已经吃过了");
            autoEatCallback();
          }
        }
      }
      // 将吃肉插入到文件回帖后面
      fileTag.after(eatMeat);
    }
  }
  function insertText(obj, str, offset) {
    if (document.selection) {
      let sel = document.selection.createRange();
      sel.text = str;
    } else if (
      typeof obj.selectionStart === "number" &&
      typeof obj.selectionEnd === "number"
    ) {
      let startPos = obj.selectionStart,
        endPos = obj.selectionEnd,
        cursorPos = startPos,
        tmpStr = obj.value;
      obj.value =
        tmpStr.substring(0, startPos) +
        str +
        tmpStr.substring(endPos, tmpStr.length);
      cursorPos += str.length;
      obj.selectionStart = obj.selectionEnd = cursorPos - offset;
    } else {
      obj.value += str;
    }
    obj.focus();
  }
  // 吃完肉的回调
  function autoEatCallback(iSEaten = true) {
    let id = window.location.pathname.match(/\d+/)[0];
    let isAutoEatBbs = window.location.search.includes("open=new");
    // 只有吃过肉才记录
    if (iSEaten) {
      autoEatList[id] = new Date().getTime();
      setItem("autoEatList", autoEatList);
    }

    if (isFullAutoEat && isAutoEatBbs) {
      setTimeout(() => {
        if (isNewOpenIframe) {
          if (window.self !== window.top) {
            // 如果是在iframe里移除iframe
            let iframe = window.frameElement; // 获取当前 iframe 元素
            let parent = iframe.parentElement; // 获取包含当前 iframe 的父窗口对象

            parent.removeChild(iframe);
          } else {
            // 新窗口则关闭当前窗口
            window.close();
          }
        } else {
          history.back();
        }
      }, 2000);
    }
  }
  /**
   * 返回指定天数后的一天开始的时间，例如1天，则为明天00:00:00，2天则为后天00:00:00
   * 肉帖1天有效期则代表明天00:00:00过期，2天有效期则是后天00:00:00
   * @param {number} time 传入一个时间戳
   * @param {number} days 传入过期的天数
   * @returns {number} 返回到期时间的时间戳
   */

  function timeLeft(time, days = 1) {
    const target = new Date(time + (days - 1) * 24 * 60 * 60 * 1000);
    target.setHours(24, 0, 0, 0);
    return target.getTime();
  }
  // 获取值
  function getItem(key, defaultValue = {}) {
    if (key === "autoEatList") {
      let autoEatList = MY_getValue(key, {});
      // 删除过期的肉帖
      deleteExpiredID(autoEatList);
      // 更新肉帖数据
      setItem(key, autoEatList);
      return autoEatList;
    }
    return MY_getValue(key, {});
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
  // 设置值
  function setItem(key, value) {
    // if (key === "autoEatList") {
    //   deleteExpiredID(value); //删除过期的肉帖
    // }
    MY_setValue(key, value);
  }
  /**
   * 返回yaohuo_userData里的数据
   * @param {string} key 要获取值的属性
   * @param {any} value 获取的值
   * @returns {any}
   */
  function getValue(key, value) {
    let setting = yaohuo_userData;
    return setting[key] || value;
  }
  /**
   * 更新yaohuo_userData里的数据
   * @param {string} key 要设置值的属性
   * @param {any} value 设置的值
   * @returns {any}
   */
  function setValue(key, value) {
    yaohuo_userData[key] = value;
    // setItem("yaohuo_userData", yaohuo_userData);
  }
  // 增加发帖ubb
  function handleAddNewPostUBB() {
    if (postPage.includes(window.location.pathname) && isAddNewPostUBB) {
      let bookContent = document.getElementsByName("book_content")[0];
      bookContent.insertAdjacentHTML(
        "beforebegin",
        `<div class='btBox'>
            <div class='bt2'>
                <a style='width:25%' id='ubb_url'>超链接</a>
                <a style='width:25%' id='ubb_img'>图片</a>
                <a style='width:25%' id='ubb_movie'>视频</a>
                <a style='width:25%' id='ubb_more'">更多...</a>
            </div>
        </div>
        <div class='more_ubb_tools' style='display: none'>
          <div class='btBox'>
            <div class='bt2'>
                <a style='width:25%' id='ubb_random_color'>随机颜色</a>
                <a style='width:25%' id='ubb_b'">加粗</a>
                <a style='width:25%' id='ubb_strike'>删除</a>
                <a style='width:25%' id='ubb_font'>字体</a>
            </div>
          </div>
          <div class='btBox'>
            <div class='bt2'>
              <a style='width:25%' id='ubb_u'>下划线</a>
              <a style='width:25%' id='ubb_i'>斜体</a>
              <a style='width:25%' id='ubb_hr'>分割线</a>
              <a style='width:25%' href='https://www.yaohuo.me/bbs/book_view_ubb.aspx?action=class&siteid=1000&classid=177&page=1&backurl=bbs%2fbook_view_add.aspx%3fsiteid%3d1000%26classid%3d177' target="_blank">UBB使用</a>
            </div>
          </div>
          <div class='btBox'>
            <div class='bt2'>
              <a style='width:25%' id='ubb_audio'>音频</a>
              <a style='width:25%' id='ubb_left'>居左</a>
              <a style='width:25%' id='ubb_center'>居中</a>
              <a style='width:25%' id='ubb_right'>居右</a>
            </div>
          </div>
          <div class='btBox'>
              <div class='bt2'>
                  <a style='width:25%' href='https://yaohuo.me/tuchuang/' target="_blank">妖火图床</a>
                  <a style='width:25%' href='https://img.ink/' target="_blank">水墨图床</a>
                  <a style='width:25%' href='https://aapi.eu.org/dy' target="_blank">抖音解析</a>
                  <a style='width:25%' href='https://aapi.eu.org/ks' target="_blank">快手解析</a>
              </div>
          </div>
          <div class='btBox'>
            <div class='bt2'>
              <a style='width:25%' href='https://aapi.eu.org/ppx' target="_blank">皮皮虾解析</a>
              <a style='width:25%' href='https://aapi.eu.org/bili' target="_blank">b站解析</a>
              <a style='width:25%' href='https://pan.whgpc.com/upload.php' target="_blank">外链网盘</a>
              <a style='width:25%' href='https://urlify.cn/' target="_blank">短链生成</a>
            </div>
          </div>
        </div>`
      );

      addEventAry.forEach((item) => {
        handleEventListener(item.id, bookContent, item.ubb, item.offset);
      });
      document.getElementById("ubb_more").addEventListener("click", () => {
        let ubb_tool = document.getElementsByClassName("more_ubb_tools")[0];
        ubb_tool.style.display =
          ubb_tool.style.display === "none" ? "block" : "none";
      });
    }
  }
  // 增加回帖ubb
  function handleAddReplyUBB() {
    if (
      (/^\/bbs-.*\.html$/.test(window.location.pathname) ||
        viewPage.includes(window.location.pathname) ||
        "/bbs/userguessbook.aspx".includes(window.location.pathname)) &&
      isAddReplyUBB
    ) {
      const form = document.getElementsByName("f")[0];
      if (!form) {
        return;
      }
      let fileTag = document.querySelector(
        "a[href^='/bbs/book_re_addfile.aspx']"
      );
      if (!fileTag) {
        fileTag = document.querySelector("input[value='我要留言']");
      }

      // 添加ubb展开按钮
      fileTag.insertAdjacentHTML(
        "afterend",
        `<input id="ubb_unfold" type="submit" value="${
          isUnfoldUbb ? "折叠UBB" : "展开UBB"
        }" style="float:right"/>`
      );

      // 妖火图床、超链接、图片
      form.insertAdjacentHTML(
        "beforeend",
        `
        <hr>
        <div class="ubb_wrap" style="text-align: center;overflow: hidden;">
          <span id='ubb_url' style="${spanstyle}">链接</span>
          <span id='ubb_img' style="${spanstyle}">图片</span>
          <span id='ubb_audio' style="${spanstyle}">音频</span>
          <span id='ubb_movie' style="${spanstyle}">视频</span>
          <span id='ubb_random_color' style="${spanstyle}">随机颜色字</span>
          <span id='ubb_nzgsa' style="${a2style}">你真该死啊</span>

          <br>
          <span id='ubb_text' style="${spanstyle}">半角</span>
          <span id='ubb_br' style="${spanstyle}">换行</span>
          <span id='ubb_b' style="${spanstyle}">加粗</span>
          <span id='ubb_i' style="${spanstyle}">斜体</span>

          <span id='ubb_color' style="${spanstyle}">颜色字</span>
          <span id='ubb_u' style="${spanstyle}">下划线</span>
          <span id='ubb_strike' style="${spanstyle}">删除线</span>
          <span id='ubb_hr' style="${spanstyle}">分割线</span>
          <br>
          <span id='ubb_sms' style="${spanstyle}">短信</span>
          <span id='ubb_call' style="${spanstyle}">拨号</span>
          <span id='ubb_now' style="${spanstyle}">时间</span>
          <span id='ubb_codo' style="${spanstyle}">倒计天</span>
          <br>
          <a href='https://yaohuo.me/tuchuang/' target="_blank" style="${spanstyle}">图床</a>
          <a href='https://aapi.eu.org/ppx' target="_blank" style="${spanstyle}">皮皮</a>
          <a href='https://aapi.eu.org/bili' target="_blank" style="${spanstyle}">b站</a>
          <a href='https://aapi.eu.org/dy' target="_blank" style="${spanstyle}">抖音</a>
          <a href='https://aapi.eu.org/ks' target="_blank" style="${spanstyle}">快手</a>
          <a href='https://pan.whgpc.com/upload.php' target="_blank" style="${spanstyle}">外链</a>
          <a href='https://urlify.cn/' target="_blank" style="${spanstyle}">短链接</a>
        </div>
        <hr>
        `
      );

      // 处理默认展开ubb
      if (isUnfoldUbb) {
        $(".ubb_wrap").height("auto");
      } else {
        $(".ubb_wrap").height(32);
      }

      // 处理折叠ubb
      $("#ubb_unfold").click(function (event) {
        if (this.value == "折叠UBB") {
          $(".ubb_wrap").height(32);
          this.value = "展开UBB";
        } else {
          $(".ubb_wrap").height("auto");
          this.value = "折叠UBB";
        }
        event.preventDefault();
      });

      // 超链接
      const textarea = document.querySelector("textarea");
      addEventAry.forEach((item) => {
        handleEventListener(item.id, textarea, item.ubb, item.offset);
      });
    }
  }
  // 增加回帖表情
  function handleAddReplyFace() {
    if (
      (/^\/bbs-.*\.html$/.test(window.location.pathname) ||
        viewPage.includes(window.location.pathname)) &&
      isAddReplyFace
    ) {
      const form = document.getElementsByName("f")[0];
      if (!form) {
        return;
      }
      const face = form.getElementsByTagName("select")[0];
      const sendmsg = form.getElementsByTagName("select")[1];
      const textarea = form.getElementsByTagName("textarea")[0];
      // 显示表情
      textarea.insertAdjacentHTML("beforebegin", '<div id="facearea"></div>');
      const facearea = document.getElementById("facearea");

      let allFaceHtml = "";
      faceList.forEach((faceStr, i) => {
        let name = faceStr.split(".")[0];
        allFaceHtml += `
        <img
          id="setFace${i}"
          style="width: 32px;height: 32px"
          src="face/${faceStr}"
          value="${name}.gif"
        />`;
      });
      diyFaceList.forEach((item, i) => {
        allFaceHtml += `
        <img
          id="diyFace${i}"
          data-src="${item.url}"
          style="width: 32px;height: 32px"
          src="${item.url}"
          value="${item.name}.gif"
        />`;
      });
      facearea.innerHTML = allFaceHtml;

      // 添加表情展开按钮
      sendmsg.insertAdjacentHTML(
        "afterend",
        `<span 
          style="${spanstyle}display:${
          isUnfoldFace ? "display: block" : "display: none"
        }" id="unfold"
          >表情${isUnfoldFace ? "折叠" : "展开"}</span>`
      );

      // 处理点击添加表情包
      facearea.onclick = function (event) {
        if (event.target.tagName.toLowerCase() === "img") {
          // 自定义图片
          let diySrc = event.target.dataset.src;

          if (diySrc) {
            //把光标移到文本框最前面
            textarea.focus();
            textarea.setSelectionRange(0, 0);
            insertText(textarea, `[img]${diySrc}[/img]`, 0);
          } else {
            // 处理图片的点击事件
            face.value = event.target.getAttribute("value");
          }

          // 处理完折叠表情
          $("#facearea").hide();
          $("#unfold").text("表情展开");
        }
      };
      // 处理默认展开表情
      if (isUnfoldFace) {
        $("#facearea").show();
      } else {
        $("#facearea").hide();
      }
      // 处理折叠表情
      $("#unfold").click(function (event) {
        if (this.innerText == "表情展开") {
          $("#facearea").show();
          this.innerText = "表情折叠";
        } else {
          $("#facearea").hide();
          this.innerText = "表情展开";
        }
      });
    }
  }
  function handleAddReplyRandomColor() {
    if (
      /^\/bbs-.*\.html$/.test(window.location.pathname) ||
      viewPage.includes(window.location.pathname)
    ) {
      const form = document.getElementsByName("f")[0];
      if (!form) {
        return;
      }
      const replyBtn = document.getElementsByName("g")[0];
      const textarea = document.querySelector(".retextarea");
      let isAutoEatBbs = window.location.search.includes("open=new");

      let randomColor = getColorWithinBrightnessRange(0, 200);
      let random = Math.random();
      // 整句随机颜色
      let isAddColorByAll = random < 0.1;
      // 每个字符随机颜色
      let isAddColorByCharacter = random < 0.01;
      let isAddColor = isAddColorByAll || isAddColorByCharacter;
      let reg = /\[(\w+)=?([^\]]+)?\]([\s\S]*?)\[\/\1\]/;
      let colorReg =
        /\[forecolor=(#[0-9A-Fa-f]{6}|[A-Za-z]+)\].*?\[\/forecolor\]/;
      replyBtn.addEventListener(
        "click",
        (e) => {
          // 取消提交
          if (!isAutoEatBbs && !colorReg.test(textarea.value)) {
            if (isAddColorByCharacter) {
              textarea.value = getColorText(textarea.value);
            } else if (isAddColorByAll) {
              textarea.value = `[forecolor=${randomColor}]${textarea.value}[/forecolor]`;
            }
          }
        },
        true
      );
    }
  }
  /**
   * 返回指定亮度范围的颜色
   * @param {number} minBrightness 最小的亮度
   * @param {number} maxBrightness 最大的亮度
   * @returns 范围指定亮度范围内的颜色
   */
  function getColorWithinBrightnessRange(
    minBrightness = 0,
    maxBrightness = 200
  ) {
    let color;
    let brightness;
    do {
      color = getRandomHexColor(); // 调用生成随机十六进制颜色的函数
      brightness = calculateBrightnessHex(color);
    } while (brightness < minBrightness || brightness > maxBrightness);

    return color;

    // 生成随机十六进制颜色
    function getRandomHexColor() {
      let letters = "0123456789ABCDEF";
      let color = "#";
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    /**
     * 0: 完全黑色。
     * 50: 比较暗的颜色。
     * 100: 中等亮度。
     * 150: 较明亮的颜色。
     * 200: 较亮的颜色。
     * 255: 完全白色。
     * @param {string} color 十六进制颜色
     * @returns 返回计算后的亮度
     */
    function calculateBrightnessHex(color) {
      // 移除颜色值中的"#"
      color = color.replace("#", "");

      // 提取红、绿、蓝通道的值
      let red = parseInt(color.substr(0, 2), 16);
      let green = parseInt(color.substr(2, 2), 16);
      let blue = parseInt(color.substr(4, 2), 16);

      // 根据亮度计算公式计算颜色的亮度
      let brightness = (red * 299 + green * 587 + blue * 114) / 1000;

      return brightness;
    }
  }
  function handleReply() {
    if (
      (/^\/bbs-.*\.html$/.test(window.location.pathname) ||
        viewPage.includes(window.location.pathname)) &&
      (isAddReplyUBB || isAddReplyFace)
    ) {
      // 取消回复文本框粘性定位。
      $(".sticky").addClass("add-position-static");

      // 回复页不处理
      if (!window.location.pathname.includes("/bbs/book_re.aspx")) {
        document
          .querySelector(".recontent")
          .addEventListener("click", (event) => {
            if (event.target.innerText === "回") {
              // 如果是回复指定楼层就定位到回复输入框
              if (
                /回复\d+楼/.test(document.querySelector(".sticky b")?.innerText)
              ) {
                window.scrollTo(0, document.querySelector(".sticky").offsetTop);
              }
            }
          });
      }
    }
  }
  function handleUploadImage() {
    if (isUploadImage) {
      let textArea = document.getElementsByTagName("textarea")[0];
      if (!textArea) return;
      // 排除游戏大厅页面
      if (/^\/games\/\w+\/index\.aspx$/.test(window.location.pathname)) return;

      let isReplyPage =
        /^\/bbs-.*\.html$/.test(window.location.pathname) ||
        viewPage.includes(window.location.pathname);
      MY_addStyle(`
        .upload-wrap {
          position: relative;
          display: inline-block;
          width: 100%;
          box-sizing: border-box;
          height: 50px;
          border: 2px dashed #ccc;
          border-radius: 5px;
          font-size: 16px;
          color: #555;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        .upload-wrap-disabled{
          background: #ddd;
          cursor: not-allowed;
        }
        .upload-wrap:hover {
          border-color: #aaa;
        }
        .upload-wrap:focus {
          outline: none;
        }
        .upload-input-label {
          width: 100%;
          height: 100%;
          font-weight: bold;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .upload-loading {
          box-sizing: border-box;
          border: 6px solid #f3f3f3;
          border-top: 6px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
          margin: auto;
          position: absolute;
          z-index: 10;
          left: 50%;
          top: 50%;
          margin-top: -20px;
          margin-left: -20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `);
      textArea.insertAdjacentHTML(
        "afterend",
        `<label for="upload-input" class="upload-wrap">
            <div class="upload-loading" style="display: none"></div>
            <span class="upload-input-label">
              <svg t="1683636826356" style="margin-right: 10px" class="icon" fill="#16baaa" viewBox="0 0 1264 1024" version="1.1" 
                xmlns="http://www.w3.org/2000/svg" p-id="9231" width="38" height="38">
                <path d="M992.171444 312.62966C975.189616 137.155482 827.415189 0 647.529412 0 469.849434 0 323.616239 133.860922 303.679205 306.210218 131.598564 333.839271 0 482.688318 0 662.588235c0 199.596576 161.815189 361.411765 361.411765 361.411765h184.014581V692.705882H294.530793l337.939795-361.411764 337.939796 361.411764H726.132229v331.294118H933.647059v-1.555371c185.470975-15.299199 331.294118-170.426291 331.294117-359.856394 0-168.969898-116.101408-310.367302-272.769732-349.958575z" p-id="9232"></path>
              </svg>
              选择或拖拽图片上传到图床
            </span>
            <input
              type="file"
              multiple
              id="upload-input"
              accept="image/*"
              style="display: none"
            />
        </label>`
      );

      // 获取上传图标的 input 元素
      const uploadInput = document.querySelector("#upload-input");
      const uploadWrap = document.querySelector(".upload-wrap");
      const uploadLoading = document.querySelector(".upload-loading");

      uploadInput.addEventListener("change", handleFileSelect);
      uploadWrap.addEventListener("dragover", handleDragOver);
      uploadWrap.addEventListener("drop", handleDrop);
      textArea.addEventListener("paste", handlePaste);

      // 剪贴板事件
      async function handlePaste(event) {
        const clipboardData =
          event.clipboardData || event.originalEvent.clipboardData;
        const items = clipboardData.items;

        handleUploadStatus("start");
        const files = [];

        for (const item of items) {
          if (item.type.indexOf("image") !== -1) {
            const blob = item.getAsFile();
            // paste 事件的处理程序是异步的，所以不能在这里直接上传，否则有多个只会读取第一个
            // await uploadFile(blob);
            files.push(blob);
          }
        }

        // 此处处理上传
        for (const item of files) {
          await uploadFile(item);
        }
        handleUploadStatus("end");
      }

      // 上传事件
      async function uploadFile(file) {
        const formData = new FormData();
        formData.append("image", file);

        try {
          const response = await fetch("https://img.ink/api/upload", {
            method: "POST",
            headers: {
              token: token || "",
            },
            body: formData,
          });

          const res = await response.json();
          let {
            code,
            data,
            data: { url },
            msg,
          } = res;

          if (code === 200) {
            if (url) {
              // 如果是回帖页面把光标移到文本框最前面
              if (isReplyPage) {
                textArea.focus();
                textArea.setSelectionRange(0, 0);
              }

              insertText(textArea, `[img]${url}[/img]`, 0);
            }
          } else {
            alert(msg);
          }
        } catch (error) {
          alert(error);
          console.error("上传失败:", error);
        }
      }

      // 选择文件change事件
      async function handleFileSelect(event) {
        const files = event.target.files;
        handleUploadStatus("start");
        for (const file of files) {
          await uploadFile(file);
        }
        handleUploadStatus("end");
      }
      // 拖拽事件
      function handleDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }

      async function handleDrop(event) {
        event.stopPropagation();
        event.preventDefault();

        const files = event.dataTransfer.files;
        handleUploadStatus("start");
        for (const file of files) {
          if (file.type.indexOf("image") !== -1) {
            await uploadFile(file);
          }
        }
        handleUploadStatus("end");
      }
      /**
       * 处理上传状态
       * @param {'start' | 'end'} type 处理的状态
       */
      function handleUploadStatus(type) {
        if (type === "start") {
          uploadWrap.classList.toggle("upload-wrap-disabled");
          uploadInput.disabled = true;
          uploadLoading.style.display = "block";
        }
        if (type === "end") {
          uploadWrap.classList.toggle("upload-wrap-disabled");
          uploadInput.disabled = false;
          uploadLoading.style.display = "none";
          uploadInput.value = "";
        }
      }
    }
  }
  // 处理404页面跳回新帖页面
  function handleNotFoundPage() {
    if (notFoundPage.includes(window.location.pathname)) {
      history.go(-2);
      // let year = new Date().getFullYear();
      // location.href = `/bbs/book_list.aspx?gettotal=${year}&action=new`;
    }
  }
  // 自动增加时长
  function handleAutoAddOnlineDuration() {
    // 是否自动增加时长
    if (!timer) {
      timer = setInterval(function () {
        location.reload();
      }, timeInterval * 1000);
    }
  }
  /**
   * 删除过期的帖子
   * @param {number|string} value 存储肉帖的对象
   */
  function deleteExpiredID(value) {
    let nowTime = new Date().getTime();

    Object.keys(value).forEach((key) => {
      let lastTime = value[key];
      if (nowTime > timeLeft(lastTime, expiredDays)) {
        delete value[key];
      }
    });
  }
  // 获取用户等级
  function handleShowUserLevel() {
    if (!/^\/bbs-.*\.html$/.test(window.location.pathname) || !isShowLevel) {
      return;
    }

    let user_id =
      document.getElementsByClassName("subtitle")[0].firstElementChild.href;

    function success(rp) {
      let lv_zz = /<b>等级:<\/b>(\S*)级/;
      let lv_text = rp.match(lv_zz)?.[1] || "0";
      // console.log(lv_text);
      addLvTip(lv_text);
    }

    function fail(code) {
      console.log("error");
    }

    let request = new XMLHttpRequest();

    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if (request.status === 200) {
          return success(request.responseText);
        } else {
          return fail(request.status);
        }
      } else {
      }
    };
    request.open("GET", user_id);
    //request.responseType = 'document';
    request.send();

    function addLvTip(lv) {
      let info_d = document.getElementsByClassName("subtitle")[0];
      let user_name_d = info_d.children[1];
      console.log(user_name_d);

      let lv_d = document.createElement("div");
      lv_d.innerText = "Lv " + lv;
      lv_d.style =
        "display:inline;margin-left:10px; text-align:center; margin-right:10px;color:#ff4234;font-size:17px;border-radius: 30px;";
      info_d.insertBefore(lv_d, user_name_d);
    }
  }
  function handleAddLoadMoreBtnClick() {
    // 如果打开了全自动吃肉和自动加载更多，并且在帖子列表页才添加事件
    let isPage = loadNextPage.some((item) =>
      item.test(window.location.pathname)
    );
    if (
      isPage ||
      (isFullAutoEat && bbsPage.includes(window.location.pathname))
    ) {
      let loadMoreBtn = null;
      let nextPageWrap = document.querySelector(".bt2");
      if (loadNextPageType === "nextPage" && nextPageWrap) {
        loadMoreBtn = nextPageWrap.firstChild;
      } else {
        loadMoreBtn = document.querySelector("#KL_loadmore");
      }
      loadMoreBtn?.addEventListener("click", (e) => {
        isClickLoadMoreBtn = true;
        isNewPage = false;
      });
    }
  }
  // 自动加载下一页
  function handleLoadNextPage() {
    // 处理自动加载更多
    let isPage = loadNextPage.some((item) =>
      item.test(window.location.pathname)
    );
    if (isPage && isLoadNextPage) {
      let nextBtn = null;
      let nextPageWrap = document.querySelector(".bt2");
      // 距离按钮最大多少就会触发
      let bottomMaxDistance = 250;
      if (loadNextPageType === "more" || !nextPageWrap) {
        nextBtn = document.querySelector("span[id$=show_tip]");
      } else {
        nextBtn = nextPageWrap.firstChild;
        bottomMaxDistance = 150;
      }
      let A = nextBtn.getBoundingClientRect().bottom;
      let B = document.documentElement.clientHeight;
      // 获取当前列表的长度
      let newLength = getListLength();

      // 加载更多按钮距离距底部小于300px才开始加载
      // 没有加载完成前不会再次加载
      // 小于页面最大加载数量才会加载
      if (
        A <= B + bottomMaxDistance &&
        !isClickLoadMoreBtn &&
        newLength < maxLoadNum
      ) {
        nextBtn.click();
        // 放到加载更多按钮里面监听，此处不处理
        // isClickLoadMoreBtn = true;
        // isNewPage = false;
      }
    }
  }
  /**
   * 节流函数
   * @param {function} fn - 要节流的函数
   * @param {number} interval - 节流时间间隔（毫秒）
   * @param {Object} options - 选项对象
   * @param {boolean} [options.leading=true] - 是否在开始时立即执行一次函数
   * @param {boolean} [options.trailing=isExecTrail] - 是否在结束时再执行一次函数
   * @returns {function} 节流后的函数
   */
  function throttle(
    fn,
    interval,
    { leading = true, trailing = isExecTrail } = {}
  ) {
    let startTime = 0;
    let timer = null;

    const _throttle = function (...args) {
      return new Promise((resolve, reject) => {
        try {
          // 1.获取当前时间
          const nowTime = new Date().getTime();

          // 对立即执行进行控制
          if (!leading && startTime === 0) {
            startTime = nowTime;
          }

          // 2.计算需要等待的时间执行函数
          const waitTime = interval - (nowTime - startTime);
          if (waitTime <= 0) {
            // console.log("执行操作fn")
            if (timer) clearTimeout(timer);
            const res = fn.apply(this, args);
            resolve(res);
            startTime = nowTime;
            timer = null;
            return;
          }

          // 3.判断是否需要执行尾部
          if (trailing && !timer) {
            timer = setTimeout(() => {
              // console.log("执行timer")
              const res = fn.apply(this, args);
              resolve(res);
              startTime = new Date().getTime();
              timer = null;
            }, waitTime);
          }
        } catch (error) {
          reject(error);
        }
      });
    };

    _throttle.cancel = function () {
      if (timer) clearTimeout(timer);
      startTime = 0;
      timer = null;
    };

    return _throttle;
  }
  /**
   * 添加事件监听
   * @param {string} id dom元素id
   * @param {HTMLElement} textarea 插入的文本框
   * @param {string} ubb 插入的内容
   * @param {number} offset 插入的位置
   */
  function handleEventListener(id, textarea, ubb, offset) {
    document.getElementById(id)?.addEventListener("click", (e) => {
      // 需要替换文字的ubb
      let ary = [
        "ubb_url",
        "ubb_text",
        "ubb_font",
        "ubb_b",
        "ubb_i",
        "ubb_u",
        "ubb_color",
        "ubb_random_color",
        "ubb_img",
        "ubb_strike",
        "ubb_call",
        "ubb_codo",
        "ubb_audio",
        "ubb_movie",
      ];
      let reg = /\[(\w+)=?([^\]]+)?\]([\s\S]*?)\[\/\1\]/g;
      // 处理你真的该死语音
      if (id === "ubb_nzgsa") {
        // if (textarea.value !== "") {
        insertText(
          textarea,
          "[audio=X]https://file.uhsea.com/2304/3deb45e90564252bf281f47c7b47a153KJ.mp3[/audio]",
          0
        );
        // } else {
        //   alert("不要无意义灌水啦！");
        // }
      } else if (id === "ubb_random_color") {
        // 处理随机颜色

        // 如果有选择文本，则每一个文本都替换
        let selectText = getSelectText(textarea);
        console.log(selectText);
        let randomColor = getColorWithinBrightnessRange();
        let ubb2 = `[forecolor=${randomColor}]${
          selectText || "颜色文字，随机颜色"
        }[/forecolor]`;
        // if (
        //   selectText &&
        //   confirm(
        //     "检测到当前选择了很多文字，是否给每个字符加随机颜色，否则只为整个字符加颜色"
        //   )
        // ) {
        //   ubb2 = getColorText(selectText);
        // }
        e.preventDefault();
        insertText(textarea, ubb2, 12);
      } else if (ary.includes(id)) {
        let ubb2 = ubb;
        let match = reg.exec(ubb);
        let selectText = getSelectText(textarea);
        console.log({ match, ubb, selectText });
        let urlAry = ["img", "url", "audio", "movie"];
        let urlRegex = /^(https?|ftp):\/\/[^\s\/\$\.\?#].[^\s]*$/i;

        if (id === "ubb_url") {
          if (urlRegex.test(selectText)) {
            ubb2 = ubb.replace(match[2], selectText || match[2]);
          }
        } else if (match[3]) {
          if (urlAry.includes(match[1])) {
            if (urlRegex.test(selectText)) {
              ubb2 = ubb.replace(match[3], selectText || match[3]);
            }
          } else {
            ubb2 = ubb.replace(match[3], selectText || match[3]);
          }
        }

        e.preventDefault();
        insertText(textarea, ubb2, offset);
      } else {
        e.preventDefault();
        insertText(textarea, ubb, offset);
      }
    });
  }
  function getColorText(text = "") {
    let str = "";
    for (let char of text) {
      let randomColor = getColorWithinBrightnessRange();
      if (!/\s/.test(char)) {
        str += `[forecolor=${randomColor}]${char}[/forecolor]`;
      } else {
        str += char;
      }
    }
    return str;
  }
  function getSelectText(textarea) {
    let startPos = textarea.selectionStart;
    let endPos = textarea.selectionEnd;
    let selectedText = textarea.value.substring(startPos, endPos);
    return selectedText;
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
