// ==UserScript==
// @name         妖火网增强插件
// @namespace    https://yaohuo.me/
// @version      1.8.4
// @description  二改添加修改发帖ubb、回帖表情等功能
// @author       ID12167
// @match        *yaohuo.me/*
// @icon         https://yaohuo.me/css/favicon.ico
// @run-at       document-end
// @license      MIT
// ==/UserScript==

//定义一些常量
const viewPage = ["/bbs/book_re.aspx", "/bbs/book_view.aspx"];
const postPage = [
  "/bbs/book_view_add.aspx",
  "/bbs/book_view_sendmoney.aspx",
  "/bbs/book_view_addvote.aspx",
  "/bbs/book_view_addfile.aspx",
  "/bbs/book_view_mod.aspx",
];
//原表情包预览
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

const spanstyle =
  "color: #fff; padding: 2px 4px; font-size: 14px; background-color: #ccc; display:none;border-radius: 10%;";
const a1style =
  "color: #fff; padding: 2px 4px; font-size: 14px; background-color: #66ccff;border-radius: 10%;";
const a2style =
  "color: #fff; padding: 2px 4px; font-size: 14px; background-color: #d19275;border-radius: 10%;";
const a3style =
  "color: #fff; padding: 2px 4px; font-size: 14px; background-color: #66ccff;float: right;border-radius: 20%;font-weight: bold;margin-right: 5px;";

if (
  /^\/bbs-.*\.html$/.test(window.location.pathname) ||
  viewPage.includes(window.location.pathname)
) {
  const form = document.getElementsByName("f")[0];
  const face = form.getElementsByTagName("select")[0];
  const sendmsg = form.getElementsByTagName("select")[1];
  const content = form.getElementsByTagName("textarea")[0];
  sendmsg.insertAdjacentHTML(
    "afterend",
    '<span style="' + a1style + '" id="unfold">表情展开</span>'
  );
  let unfold = document.getElementById("unfold");
  let spread = false;
  unfold.onclick = function unfoldFace() {
    let facehtml = "";
    if (!spread) {
      spread = true;
      faceList.forEach((faceStr, i) => {
        facehtml +=
          '<img id="setFace' +
          i +
          '" style="width: 32px; height: 32px" src="face/' +
          faceStr +
          '" value="' +
          faceStr.split(".")[0] +
          '.gif"></img>';
      });
      content.insertAdjacentHTML(
        "beforebegin",
        '<div id="facearea">' + facehtml + "</div>"
      );
      const facearea = document.getElementById("facearea");
      for (let i = 0; i < faceList.length; i++) {
        document.getElementById("setFace" + i).onclick = function setFace() {
          face.value = faceList[i];
          form.removeChild(facearea);
          spread = false;
        };
      }
    } else {
      spread = false;
      form.removeChild(document.getElementById("facearea"));
    }
  };

  // 妖火图床、超链接、图片
  form.removeChild(form.lastChild);
  form.insertAdjacentHTML(
    "beforeend",
    `
        <span id='ubb_znhf' type="submit" style="${a3style};">一键回复</span>

<select name="diyface" style='background-color: #fffafa;float: right;font-weight: bold;font-size: 15px;margin-top: 5px;margin-right: 10px;'>
    <option name="1" value="">选择表情</option>
    <option id="ubb_jw" value="ubb_jw">稽舞</option>
    <option id="ubb_sj" value="ubb_sj">色稽</option>
    <option id="ubb_jy" value="ubb_jy">摸鱼</option>
    <option id="ubb_pt" value="ubb_pt">拍头</option>
    <option id="ubb_jg" value="ubb_jg">稽狗</option>
    <option id="ubb_sq" value="ubb_sq">手枪</option>
    <option id="ubb_tp" value="ubb_tp">躺平</option>
    <option id="ubb_jj" value="ubb_jj">撒娇</option>
    <option id="ubb_mq" value="ubb_mq">没钱</option>
    <option id="ubb_tg" value="ubb_tg">听歌</option>
    <option id="ubb_nt" value="ubb_nt">男同</option>
    <option id="ubb_qy" value="ubb_qt">乞讨</option>
    <option id="ubb_gz" value="ubb_gz">鼓掌</option>
    <option id="ubb_sw" value="ubb_sw">骚舞</option>
    <option id="ubb_bs" value="ubb_bs">鄙视</option>
    <option id="ubb_cs" value="ubb_cs">吃屎</option>
    <option id="ubb_tt" value="ubb_tt">踢腿</option>
    <option id="ubb_st" value="ubb_st">伸头</option>
    <option id="ubb_zj" value="ubb_zj">追稽</option>
    <option id="ubb_lsj" value="ubb_lsj">司稽</option>
  </select>

        <br><center><span id='ubb_nzgsa' style="${a2style}">你真该死啊</span>
        <span id='ubb_hr' style="${a2style}">分割线</span>
        <span id='ubb_jz' style="${a2style};display: none;">居左</span>
        <span id='ubb_hhf' style="${a2style}">换行符</span>
        <span id='ubb_jyo' style="${a2style};display: none;">居右</span>
        <span id='ubb_url' style="${a1style}">超链</span>
         <span id='ubb_img' style="${a1style}">图片</span>
         <a href='https://www.yaohuo.me/tuchuang/' target="_blank" style="${a1style}">图床</a>
         <a href='https://img.ink/' target="_blank" style="${a1style}">水墨图床</a>
        </span>
      `
  );

  //选择表情后自动点击评论区调出输入法
  var selectElem = document.querySelector('[name="diyface"]');
  selectElem.addEventListener("change", function () {
    var selectedValue = this.value;
    if (selectedValue !== "") {
      var textareaElem = document.querySelector('[name="content"]');
      textareaElem.focus();
    }
  });

  //监测select选项的变化
  var textareaname = document.querySelector('[name="content"]');
  var selectElement = document.querySelector('[name="diyface"]');
  var lastValue = "";
  selectElement.addEventListener("change", function () {
    var selectedOption = selectElement.selectedOptions[0];
    var selectedValue = "[" + selectedOption.value + "]"; // 在选项值前后添加中括号
    // 将上一次插入的值用空字符串替换掉
    textareaname.value = textareaname.value.replace(lastValue, "");
    // 记录本次插入的值
    lastValue = selectedValue;
  });

  // 超链接
  const textarea = document.querySelector(
    "body > div.sticky > form > textarea"
  );

  //diy表情包
  const quickReplyBtn = document.querySelector("input[name='g']");
  document.getElementById("ubb_znhf").addEventListener("click", (e) => {
    e.preventDefault();

    const textarea = document.querySelector("textarea[name='content']");

    //返回值匹配表情包ID
    if (textarea.value !== "") {
      // 获取所选UBB代码
      const selectedValue = document.querySelector(
        "select[name='diyface']"
      ).value;
      //把光标移到文本框最前面
      textarea.focus();
      textarea.setSelectionRange(0, 0);
      // 根据所选UBB代码插入不同的表情包
      if (selectedValue === "ubb_jy") {
        insertText(textarea, "[img]https://i.ibb.co/hXBXGq8/jy.gif[/img]", 0);
      } else if (selectedValue === "ubb_jw") {
        insertText(textarea, "[img]https://i.ibb.co/L0scf9m/jw.gif[/img]", 0);
      } else if (selectedValue === "ubb_sj") {
        insertText(textarea, "[img]https://i.ibb.co/rmQY19V/sj.gif[/img]", 0);
      } else if (selectedValue === "ubb_jj") {
        insertText(textarea, "[img]https://i.ibb.co/h14QP4d/jj.gif[/img]", 0);
      } else if (selectedValue === "ubb_jg") {
        insertText(textarea, "[img]https://i.ibb.co/9yD4mFW/jg.gif[/img]", 0);
      } else if (selectedValue === "ubb_mq") {
        insertText(textarea, "[img]https://i.ibb.co/CnNY1SG/mq.gif[/img]", 0);
      } else if (selectedValue === "ubb_sw") {
        insertText(textarea, "[img]https://i.ibb.co/0qTfStm/sw.gif[/img]", 0);
      } else if (selectedValue === "ubb_cs") {
        insertText(textarea, "[img]https://i.ibb.co/yh8bSx7/cs.gif[/img]", 0);
      } else if (selectedValue === "ubb_bs") {
        insertText(textarea, "[img]https://i.ibb.co/3BxqbXX/bs.gif[/img]", 0);
      } else if (selectedValue === "ubb_tg") {
        insertText(textarea, "[img]https://i.ibb.co/3NrbQfQ/tg.gif[/img]", 0);
      } else if (selectedValue === "ubb_st") {
        insertText(textarea, "[img]https://i.ibb.co/whDBFQd/st.gif[/img]", 0);
      } else if (selectedValue === "ubb_gz") {
        insertText(textarea, "[img]https://i.ibb.co/7KzRsmd/gz.gif[/img]", 0);
      } else if (selectedValue === "ubb_tt") {
        insertText(textarea, "[img]https://i.ibb.co/KNGfHFw/tt.gif[/img]", 0);
      } else if (selectedValue === "ubb_nt") {
        insertText(textarea, "[img]https://i.ibb.co/sKS4R3x/nt.png[/img]", 0);
      } else if (selectedValue === "ubb_sq") {
        insertText(textarea, "[img]https://i.ibb.co/VCWLFgz/sq.gif[/img]", 0);
      } else if (selectedValue === "ubb_pt") {
        insertText(textarea, "[img]https://i.ibb.co/pjw803c/pt.gif[/img]", 0);
      } else if (selectedValue === "ubb_tp") {
        insertText(textarea, "[img]https://i.ibb.co/fNcvwj0/tp.gif[/img]", 0);
      } else if (selectedValue === "ubb_zj") {
        insertText(textarea, "[img]https://i.ibb.co/5jJwwdQ/zj.gif[/img]", 0);
      } else if (selectedValue === "ubb_lsj") {
        insertText(textarea, "[img]https://i.ibb.co/mRLMkyv/lsj.gif[/img]", 0);
      } else if (selectedValue === "ubb_qt") {
        insertText(textarea, "[img]https://i.ibb.co/7KKybVg/qt.gif[/img]", 0);
      } else if (selectedValue === "ubb_sj") {
        insertText(textarea, "[img]https://i.ibb.co/rmQY19V/sj.gif[/img]", 0);
      }

      // 插入智能回复的内容
      //insertText(textarea, "[right]", 0);
      // 触发快速回复按钮的点击事件
      quickReplyBtn.click();
      textarea.value = "";
    }
  });

  //其他评论ubb模块
  document.getElementById("ubb_jyo").addEventListener("click", (e) => {
    e.preventDefault();
    insertText(textarea, "[right]", 0);
  });
  document.getElementById("ubb_jz").addEventListener("click", (e) => {
    e.preventDefault();
    insertText(textarea, "[left]", 0);
  });
  document.getElementById("ubb_hhf").addEventListener("click", (e) => {
    e.preventDefault();
    insertText(textarea, "///", 0);
  });
  document.getElementById("ubb_hr").addEventListener("click", (e) => {
    e.preventDefault();
    insertText(textarea, "[hr]", 0);
  });
  document.getElementById("ubb_nzgsa").addEventListener("click", () => {
    const textarea = document.querySelector('[name="content"]');
    if (textarea.value !== "") {
      const regex = /\[audio=[\w]+\].*\[\/audio\]/;
      if (regex.test(textarea.value)) {
        alert("你已经插入一个啦，别太贪心！");
      } else {
        insertText(
          textarea,
          "[audio=X]https://file.uhsea.com/2304/3deb45e90564252bf281f47c7b47a153KJ.mp3[/audio]",
          0
        );
      }
    } else {
      alert("不要无意义灌水啦！");
    }
  });
  document.getElementById("ubb_url").addEventListener("click", (e) => {
    e.preventDefault();
    insertText(textarea, "[url][/url]", 6);
  });
  document.getElementById("ubb_img").addEventListener("click", (e) => {
    e.preventDefault();
    insertText(textarea, "[img][/img]", 6);
  });
} else if (postPage.includes(window.location.pathname)) {
  // 发帖UBB增强
  let bookContent = document.getElementsByName("book_content")[0];
  bookContent.insertAdjacentHTML(
    "beforebegin",
    `<div class='btBox'>
          <div class='bt2'>
              <a style='width:25%' id='ubb_a'>超链接</a>
              <a style='width:25%' id='ubb_img'>图片</a>
              <a style='width:25%' id='ubb_movie'>视频</a>
              <a style='width:25%' id='ubb_more'">更多...</a>
          </div>
        </div>
      <div class='more_ubb_tools' style='display: none'>
          <div class='btBox'>
              <div class='bt2'>
                  <a style='width:25%' id='ubb_s'>删除线</a>
                  <a style='width:25%' id='ubb_f'>颜色</a>
                  <a style='width:25%' id='ubb_font'>字体</a>
                  <a style='width:25%' id='ubb_b'">加粗</a>
              </div>
          </div>
             <div class='btBox'>
                <div class='bt2'>
<a style='width:25%' id='ubb_u'>下划线</a>
<a style='width:25%' id='ubb_i'>斜体</a>
<a style='width:25%' id='ubb_ip'>ip</a>
<a style='width:25%' id='ubb_id'>id</a>
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
                  <a style='width:25%' id='ubb_hr'>分割线</a>
                  <a style='width:25%' href='https://aapi.eu.org/dy'>抖音解析</a>
                  <a style='width:25%' href='https://www.yaohuo.me/tuchuang/'>妖火图床</a>
                  <a style='width:25%' href='https://img.ink/'>水墨图床</a>
              </div>
          </div>
      </div>`
  );

  document
    .getElementById("ubb_id")
    .addEventListener("click", () => insertText(bookContent, "[userid]", 0));

  document
    .getElementById("ubb_ip")
    .addEventListener("click", () => insertText(bookContent, "[ip]", 0));

  document
    .getElementById("ubb_u")
    .addEventListener("click", () => insertText(bookContent, "[u][/u]", 4));

  document
    .getElementById("ubb_i")
    .addEventListener("click", () => insertText(bookContent, "[i][/i]", 4));
  document
    .getElementById("ubb_hr")
    .addEventListener("click", () => insertText(bookContent, "[hr]", 0));

  document
    .getElementById("ubb_font")
    .addEventListener("click", () =>
      insertText(bookContent, "[font=serif][/font]", 7)
    );

  document
    .getElementById("ubb_left")
    .addEventListener("click", () => insertText(bookContent, "[left]", 0));

  document
    .getElementById("ubb_center")
    .addEventListener("click", () => insertText(bookContent, "[center]", 0));

  document
    .getElementById("ubb_right")
    .addEventListener("click", () => insertText(bookContent, "[right]", 0));
  document
    .getElementById("ubb_a")
    .addEventListener("click", () => insertText(bookContent, "[url][/url]", 6));
  document
    .getElementById("ubb_f")
    .addEventListener("click", () =>
      insertText(bookContent, "[forecolor=#FF0000][/forecolor]", 12)
    );
  document
    .getElementById("ubb_b")
    .addEventListener("click", () => insertText(bookContent, "[b][/b]", 4));
  document
    .getElementById("ubb_s")
    .addEventListener("click", () =>
      insertText(bookContent, "[strike][/strike]", 9)
    );

  document
    .getElementById("ubb_movie")
    .addEventListener("click", () =>
      insertText(bookContent, "[movie=100%*100%]|[/movie]", 9)
    );
  document
    .getElementById("ubb_audio")
    .addEventListener("click", () =>
      insertText(bookContent, "[audio=X][/audio]", 8)
    );
  document.getElementById("ubb_more").addEventListener("click", () => {
    let ubb_tool = document.getElementsByClassName("more_ubb_tools")[0];
    ubb_tool.style.display =
      ubb_tool.style.display === "none" ? "block" : "none";
  });
}

function insertText(obj, str, offset) {
  if (document.selection) {
    var sel = document.selection.createRange();
    sel.text = str;
  } else if (
    typeof obj.selectionStart === "number" &&
    typeof obj.selectionEnd === "number"
  ) {
    var startPos = obj.selectionStart,
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

if (
  /^\/bbs\/book_re.aspx$/.test(window.location.pathname) ||
  viewPage.includes(window.location.pathname)
) {
  //自动加载回复
  if (document.getElementById("KL_loadmore")) {
    // 定义一个函数，在页面滚动到底部时触发
    function onScrollToBottom() {
      document.getElementById("KL_loadmore").click();
    }
    // 定义一个节流函数，用于限制 onScrollToBottom 函数的调用频率
    function throttle(func, wait) {
      let timer = null;
      return function () {
        if (!timer) {
          timer = setTimeout(() => {
            func.apply(this, arguments);
            timer = null;
          }, wait);
        }
      };
    }
    // 监听滚动事件，并使用节流函数来限制 onScrollToBottom 的调用频率
    window.addEventListener(
      "scroll",
      throttle(() => {
        const scrollTop =
          document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight =
          document.documentElement.scrollHeight || document.body.scrollHeight;
        const clientHeight =
          document.documentElement.clientHeight || document.body.clientHeight;
        // 判断页面是否已滚动到底部
        if (scrollTop + clientHeight >= scrollHeight - 400) {
          onScrollToBottom();
        }
      }, 500)
    );
  }
}
