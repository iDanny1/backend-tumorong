"""Submit one internal warehouse report to the authorized Google mailbox."""
import base64
from email.message import EmailMessage
from email.policy import SMTP
from email.utils import formatdate
import json
import os
import sys
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


def message_for(report):
    day = report["day"]
    display_day = "/".join(reversed(day.split("-")))
    mail = EmailMessage()
    mail["From"] = report["sender"]
    mail["To"] = ", ".join(report["to"])
    mail["Cc"] = ", ".join(report["cc"])
    mail["Subject"] = "[Nội bộ] Báo cáo kiểm kho ngày " + display_day
    mail["Date"] = formatdate(localtime=False)
    sender_domain = report["sender"].rsplit("@", 1)[1]
    mail["Message-ID"] = f"<{report['deliveryId']}@{sender_domain}>"
    mail.set_content(
        "Chào anh/chị,\n\n"
        "Đây là thư tự động gửi từ miniapp.tumorong.com. Hệ thống gửi kèm báo cáo kiểm kho để anh/chị theo dõi và đối chiếu.\n\n"
        f"Thời điểm kiểm kho: {report['checkedTime']} ngày {display_day}\n"
        f"Người kiểm kho: {', '.join(report['checkers'])}\n"
        f"File đính kèm: Kiem-ke-{day}.xlsx\n\n"
        "Lưu ý nội bộ: Email này chỉ dùng trong nội bộ công ty. Nếu có thắc mắc về số lượng tồn, "
        "quy cách đóng gói hoặc kết quả kiểm kê, anh/chị vui lòng liên hệ trực tiếp với người kiểm kho nêu trên. "
        "Với các vấn đề khác, anh/chị vui lòng liên hệ bộ phận IT."
    )
    mail.add_attachment(base64.b64decode(report["xlsx"], validate=True),
                        maintype="application", subtype="vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        filename=f"Kiem-ke-{day}.xlsx")
    return mail


def deliver(report):
    raw = base64.urlsafe_b64encode(message_for(report).as_bytes(policy=SMTP)).decode("ascii")
    grant = urlencode({
        "grant_type": "refresh_token",
        "client_id": os.environ["STOCK_REPORT_GOOGLE_CLIENT_ID"],
        "client_secret": os.environ["STOCK_REPORT_GOOGLE_CLIENT_SECRET"],
        "refresh_token": os.environ["STOCK_REPORT_GOOGLE_REFRESH_TOKEN"],
    }).encode("ascii")
    with urlopen(Request("https://oauth2.googleapis.com/token", data=grant), timeout=15) as response:
        access_token = json.load(response)["access_token"]
    mailbox = quote(report["sender"], safe="")
    request = Request(f"https://gmail.googleapis.com/gmail/v1/users/{mailbox}/messages/send",
                      headers={"Authorization": "Bearer " + access_token, "Content-Type": "application/json"},
                      data=json.dumps({"raw": raw}).encode("ascii"))
    try:
        with urlopen(request, timeout=30) as response:
            return "sent" if json.load(response).get("id") else "unknown"
    except HTTPError as error:
        return "failed" if 400 <= error.code < 500 and error.code != 408 else "unknown"
    except Exception:
        # Google may have accepted the message before a response was lost.
        return "unknown"


if __name__ == "__main__":
    try:
        result = deliver(json.load(sys.stdin))
    except Exception:
        result = "failed"
    print(result)
