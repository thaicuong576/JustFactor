JustFactor - Alternative Data Assessment Engine 

Updated Scoring Framework 

## **Tài liệu Kiến trúc: JustFactor Alternative Data Assessment Engine** 

Updated Scoring Framework - SME Digital Footprint, Recruitment Signal & Negative Reputation Screening 

Tài liệu này mô tả phiên bản cập nhật của Alternative Data Assessment Engine cho JustFactor. Thay vì sử dụng dữ liệu do doanh nghiệp tự cung cấp để đối chiếu mã số thuế, hệ thống tập trung vào các tín hiệu bên ngoài có thể quan sát công khai trên môi trường số. Mục tiêu là đánh giá mức độ hoạt động, độ minh bạch và rủi ro danh tiếng của SME nhằm hỗ trợ quá trình chấm điểm invoice factoring. 

Nguyên tắc thiết kế: hệ thống không đưa ra kết luận pháp lý hoặc kết luận tín dụng cuối cùng. Điểm Alternative Data chỉ là tín hiệu hỗ trợ, các risk flag cần được Admin hoặc Financial Institution hậu kiểm trước khi ra quyết định. 

## **1. Alternative Data Definition for JustFactor** 

Trong bối cảnh JustFactor, alternative data được hiểu là các dữ liệu phi truyền thống và không trực tiếp đến từ hồ sơ tài chính chính thức, ví dụ như website, fanpage, LinkedIn, trang tuyển dụng, kết quả tìm kiếm Google và các tín hiệu truyền thông bất lợi. Các dữ liệu này giúp bổ sung góc nhìn về việc SME có đang hoạt động thực tế, có hiện diện công khai ổn định và có dấu hiệu rủi ro danh tiếng hay không. 

## **2. Input Data** 

|**Nhóm dữ liệu**|**Dữ liệu thu thập**|**Mục đích sử dụng**|
|---|---|---|
|**Digital channels**|Website, fanpage, LinkedIn URL hoặc tên thương mại để<br>truy vết kênh số.|Đánh giá hiện diện số, khả năng truy cập, tần suất<br>cập nhật và tín hiệu tương tác.|
|**Recruitment**<br>**platforms**|LinkedIn Jobs, TopCV, VietnamWorks, CareerViet,<br>website tuyển dụng của công ty hoặc bài tuyển dụng<br>trên fanpage.|Xác định dấu hiệu vận hành và nhu cầu nhân sự<br>trong 12-24 tháng gần đây.|
|**Google Search results**|Kết quả tìm kiếm theo tên công ty và các keyword tiêu<br>cực như phốt, lừa đảo, scam, đa cấp, nợ, kiện, khiếu<br>nại.|Đánh giá hiện diện công khai, lịch sử xuất hiện theo<br>thời gian và risk flag về danh tiếng.|



## **3. Processing Workflow** 

|**Step**|**Processing activity**|**Expected output**|
|---|---|---|
|**1**|Crawl/check website, fanpage and LinkedIn. Extract availability, latest activity<br>date, posting frequency and engagement signals.|Digital presence profile.|
|**2**|Search recruitment platforms and company-owned hiring posts. Identify job<br>title, posting date, platform and relevance to the SME business model.|Recruitment signal profile.|
|**3**|Search Google by company name and negative keyword combinations. Take<br>the first 10 results after basic duplicate removal.|Public visibility and negative reputation<br>screening set.|
|**4**|Use AI/NLP to classify search snippets and page content where accessible into<br>relevant, irrelevant, neutral, positive, low-risk negative or high-risk negative.|Risk classification and explanation.|
|**5**|Assign confidence score from 1-5 for each component and calculate weighted<br>score on a 10-point scale.|Alternative Data Scorecard.|



For academic MVP documentation - not a final credit decision system 

Page 1 

JustFactor - Alternative Data Assessment Engine 

Updated Scoring Framework 

## **4. Scoring Framework** 

Điểm trung bình tối đa là 10.0 điểm. Hệ thống sử dụng 3 nhóm tiêu chí với trọng số theo phần trăm. Mỗi tiêu chí được gán Confidence Score từ 1 đến 5, sau đó quy đổi thành điểm theo trọng số tương ứng. 

|**Confidence**|**Hệ số quy đổi**|**Diễn giải**|
|---|---|---|
|**5/5**|100%|Rất tốt - dữ liệu rõ ràng, nhất quán, ít rủi ro.|
|**4/5**|80%|Tốt - có bằng chứng phù hợp nhưng độ phủ chưa thật mạnh.|
|**3/5**|50%|Trung bình - có tín hiệu nhưng dữ liệu còn mỏng hoặc chưa đều.|
|**2/5**|30%|Yếu - dữ liệu rời rạc, khó xác minh hoặc có cảnh báo nhẹ.|
|**1/5**|10%|Rất yếu/rủi ro cao - thiếu hiện diện hoặc có tín hiệu tiêu cực đáng kể.|



## **Điểm tiêu chí = Điểm tối đa của tiêu chí x Hệ số confidence** 

|**Tiêu chí thành phần**|**Trọng số**|**Điểm tối đa**|
|---|---|---|
|**1. Digital Presence & Activity**|35%|3.5|
|**2. Recruitment Signal**|25%|2.5|
|**3. Public Visibility, News Stability & Negative Reputation Screening**|40%|4.0|
|Tổng|100%|10.0|



## **4.1 Digital Presence & Activity** 

## Trọng số: 35% - tối đa 3.5 điểm 

Ý nghĩa nghiệp vụ: Đánh giá SME có dấu chân số thực tế, có duy trì hiện diện công khai và có hoạt động trên các kênh số như website, fanpage hoặc LinkedIn hay không. 

|**Mức điểm**|**Cách tính điểm**|
|---|---|
|**5/5 = 3.5đ**|Có ít nhất 2/3 kênh website/fanpage/LinkedIn hoạt động tốt; website truy cập được; fanpage/LinkedIn có cập<br>nhật gần đây; tần suất hoạt động tương đối đều; tương tác có dấu hiệu tự nhiên.|
|**4/5 = 2.8đ**|Có ít nhất 1-2 kênh hoạt động rõ; có cập nhật trong 6 tháng gần đây; tương tác ở mức chấp nhận được.|
|**3/5 = 1.75đ**|Có hiện diện số nhưng hoạt động chưa đều; kênh tồn tại nhưng cập nhật thưa; tương tác thấp.|
|**2/5 = 1.05đ**|Chỉ có 1 kênh tồn tại ở mức tối thiểu; website sơ sài hoặc page lâu không hoạt động; có dấu hiệu tương tác yếu<br>hoặc bất thường.|
|**1/5 = 0.35đ**|Không có website/fanpage/LinkedIn đáng tin cậy hoặc các kênh không truy cập được/gần như không hoạt động.|



## **4.2 Recruitment Signal** 

## Trọng số: 25% - tối đa 2.5 điểm 

Ý nghĩa nghiệp vụ: Là tín hiệu bổ trợ cho thấy SME còn vận hành, có nhu cầu nhân sự hoặc có tổ chức hoạt động. Không có tin tuyển dụng không đồng nghĩa doanh nghiệp ngừng hoạt động, nên tiêu chí này không được diễn giải quá cứng. 

|**Mức điểm**|**Cách tính điểm**|
|---|---|
|**5/5 = 2.5đ**|Có tuyển dụng công khai trên nhiều nền tảng uy tín như LinkedIn, TopCV, VietnamWorks, CareerViet hoặc<br>website công ty trong 12 tháng gần đây; tin đăng rõ ràng, phù hợp hoạt động doanh nghiệp.|
|**4/5 = 2.0đ**|Có ít nhất 1 nguồn tuyển dụng đáng tin cậy trong 12 tháng gần đây; nội dung tuyển dụng tương đối rõ.|
|**3/5 = 1.25đ**|Có dấu hiệu tuyển dụng nhưng cũ hơn, khoảng 12-24 tháng, hoặc chỉ xuất hiện trên một nguồn hạn chế.|
|**2/5 = 0.75đ**|Tín hiệu tuyển dụng rất yếu, rời rạc hoặc quá cũ; khó xác định tính liên tục.|
|**1/5 = 0.25đ**|Không tìm thấy dấu hiệu tuyển dụng công khai.|



For academic MVP documentation - not a final credit decision system 

Page 2 

JustFactor - Alternative Data Assessment Engine 

Updated Scoring Framework 

## **4.3 Public Visibility, News Stability & Negative Reputation Screening** 

## Trọng số: 40% - tối đa 4.0 điểm 

Ý nghĩa nghiệp vụ: Đánh giá SME có hiện diện công khai ổn định trên internet hay không, đồng thời rà soát các tín hiệu truyền thông bất lợi. Kết quả tiêu cực từ Google chỉ được xem là risk flag ban đầu, không phải kết luận cuối cùng. 

|**Mức điểm**|**Cách tính điểm**|
|---|---|
|**5/5 = 4.0đ**|Doanh nghiệp có hiện diện rõ trên Google, xuất hiện trên nhiều nguồn độc lập, có lịch sử rải rác qua nhiều năm.<br>Khi tìm kiếm với các keyword tiêu cực như phốt, lừa đảo, scam, đa cấp, nợ, kiện, khiếu nại, 10 kết quả đầu tiên<br>không có nội dung tiêu cực liên quan trực tiếp.|
|**4/5 = 3.2đ**|Có hiện diện công khai tương đối tốt, không có kết quả tiêu cực nghiêm trọng trong top 10, nhưng độ phủ thông<br>tin chưa dày hoặc lịch sử xuất hiện chưa thật ổn định.|
|**3/5 = 2.0đ**|Có một số kết quả liên quan nhưng hạn chế; phần lớn là nguồn tự công bố hoặc directory; không phát hiện tiêu<br>cực rõ ràng trong top 10 nhưng dữ liệu còn mỏng.|
|**2/5 = 1.2đ**|Kết quả tìm kiếm ít, rời rạc, hoặc có một vài kết quả tiêu cực trong top 10 nhưng nguồn/độ liên quan chưa đủ<br>rõ; cần Admin kiểm tra lại.|
|**1/5 = 0.4đ**|Có nhiều kết quả tiêu cực trong top 10 liên quan trực tiếp đến doanh nghiệp, đặc biệt liên quan đến lừa đảo, đa<br>cấp, kiện tụng, nợ, tranh chấp hoặc khiếu nại nghiêm trọng.|



## **5. Negative Reputation Screening Logic** 

Hệ thống thực hiện adverse keyword screening bằng cách tìm kiếm tên công ty kết hợp với các keyword tiêu cực. Mục tiêu là phát hiện sớm tín hiệu rủi ro danh tiếng, chứ không tự động kết luận doanh nghiệp có hành vi vi phạm. 

|**Hạng mục**|**Thiết kế xử lý**|
|---|---|
|**Search queries**|"[tên công ty]" + phốt; "[tên công ty]" + lừa đảo; "[tên công ty]" + scam; "[tên công ty]" + đa cấp; "[tên<br>công ty]" + nợ; "[tên công ty]" + kiện; "[tên công ty]" + khiếu nại.|
|**Result window**|Lấy 10 kết quả đầu tiên sau khi loại trùng cơ bản. Với MVP, hệ thống ưu tiên title, snippet, URL và nội<br>dung trang nếu có thể truy cập.|
|**AI/NLP classification**|Phân loại kết quả thành irrelevant, neutral, positive, low-risk negative hoặc high-risk negative dựa trên<br>ngữ cảnh nội dung.|
|**Entity matching**|Chỉ trừ điểm đáng kể khi kết quả liên quan trực tiếp đến đúng SME. Nếu chỉ trùng tên chung chung, hệ<br>thống flag nhẹ hoặc bỏ qua.|
|**Manual review**|Các kết quả tiêu cực được đưa vào Admin Dashboard để hậu kiểm. FI chỉ nên xem đây là tín hiệu hỗ trợ,<br>không phải kết luận pháp lý/tín dụng.|



For academic MVP documentation - not a final credit decision system 

Page 3 

JustFactor - Alternative Data Assessment Engine 

Updated Scoring Framework 

## **6. Output & API Response Design** 

Dữ liệu đầu ra được lưu trữ trong bảng alternative_data_assessments và được trả về cho frontend/chatbot dưới dạng scorecard có cấu trúc. Các bằng chứng thô chỉ hiển thị cho Admin để phục vụ hậu kiểm. 

|**Output field**|**Mô tả**|**Hiển thị**|
|---|---|---|
|**alternative_score**|Điểm tổng trên thang 10, tính từ 3 nhóm tiêu chí.|SME/FI/Admin|
|**confidence_breakdown**|Điểm từng tiêu chí: Digital Presence, Recruitment Signal, Public<br>Visibility & Negative Reputation Screening.|SME/FI/Admin|
|**risk_flags**|Danh sách cảnh báo như weak digital presence, outdated recruitment<br>signal, negative keyword match hoặc possible entity mismatch.|FI/Admin|
|**evidence_summary**|Tóm tắt bằng chứng đã được redacted: URL công khai, thời điểm quan<br>sát, kết luận AI ở mức ngắn gọn.|SME/FI/Admin|
|**raw_evidence**|Snippet, nội dung crawl thô, danh sách URL đầy đủ và kết quả phân<br>loại từng trang.|Admin only|



## **7. Risk Band Mapping** 

|**Score range**|**Band**|**Interpretation**|
|---|---|---|
|**8.0 - 10.0**|Strong Digital Fit|Dấu chân số rõ, hoạt động ổn định, không có adverse signal đáng<br>kể.|
|**6.0 - 7.9**|Moderate Digital Fit|Có hiện diện số và tín hiệu hoạt động, nhưng độ phủ chưa mạnh<br>hoặc còn thiếu dữ liệu.|
|**4.0 - 5.9**|Weak Digital Fit|Dữ liệu mỏng, hoạt động không đều hoặc có một số cảnh báo cần<br>hậu kiểm.|
|**0.0 - 3.9**|High Review Priority|Thiếu hiện diện đáng tin cậy hoặc có nhiều risk flag; cần Admin/FI<br>xem xét thủ công.|



## **8. Integration with JustFactor J-Score** 

Alternative Data Score có thể được tích hợp vào mô hình J-Score như một chỉ số phụ phản ánh mức độ tin cậy ngoài dữ liệu tài chính truyền thống. Trong MVP, điểm này có thể hiển thị trên SME App, Admin Dashboard và FI Marketplace; đồng thời được chatbot sử dụng để giải thích vì sao một SME được đánh giá là strong, moderate, weak hoặc cần review thêm. 

Recommended API endpoint examples: GET /api/v1/smes/{sme_id}/alternative-data-score; POST /api/v1/smes/{sme_id}/alternative-data/recalculate; GET /api/v1/smes/{sme_id}/risk-flags. 

For academic MVP documentation - not a final credit decision system 

Page 4 

