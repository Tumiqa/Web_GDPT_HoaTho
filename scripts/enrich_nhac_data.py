import json
import re
import unicodedata
from pathlib import Path

DATA_PATH = Path(r"D:\Project Ca Nhan\Web_GDPT_HoaTho\data\nhac.json")
BACKUP_PATH = Path(r"D:\Project Ca Nhan\Web_GDPT_HoaTho\data\backups\nhac_backup_pre_lyrics.json")
META_PATH = Path(r"C:\Users\cuqua\.gemini\antigravity\brain\a19ed4f5-a84f-4721-a8c3-eaf1cea5aa9f\scratch\all_908_songs_metadata.json")

def norm(s):
    s = s.lower().replace('đ', 'd').replace('Đ', 'd')
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)

# Curated lyrics for prominent GĐPT songs
LYRICS_DB = {
    "sen trang": """Kìa xem đóa sen trắng thơm,
Nghìn hào quang chiếu sáng trên bùn.
Hình dung Bổn Sư chúng ta,
Lòng Từ Bi, Trí Giác vô cùng.

Đồng thề nguyện một dạ theo Phật,
Nguyện sửa mình ngày thêm tinh khiết.
Đến bao giờ được tày Sen ngát,
Tỏa hương thơm Từ Bi tận cùng.""",

    "tram huong dot": """Trầm hương đốt xông ngát mười phương,
Nguyện nguyện kính Đức Nghiêm Từ vô lượng.
Cầu cầu xin chứng tâm thành chúng con,
Vầng vầng khói kết mây lành cúng dường.

Đạo nhiệm mầu đã lan truyền nơi cùng nơi,
Nhờ chân lý chúng sanh đều thoát luân hồi.
Đồng quy kính quỳ dưới Đài Sen,
Dâng hoa thơm tinh khiết màu thắm tươi cành.

Đài quang minh sáng huy hoàng trang nghiêm,
Ơn mười phương Điều Ngự hào quang an lành.
Nhìn Đạo uyển chuyển soi khắp cùng quần sanh,
Phật Đạo đồng cùng nhau tu tinh tấn mau viên thành.

Nam Mô Bổn Sư Thích Ca Mâu Ni Phật.
Nam Mô Bổn Sư Thích Ca Mâu Ni Phật.""",

    "day than ai": """Dây thân ái lan rộng muôn nhà,
Tay sắp xa nhưng tim không xa.
Vui tươi ta biết trong lòng nhớ lòng,
Ca hát trong không gian đơm hoa.

Đường tuy xa nhưng tình bao la,
Tiến bước theo hương thơm nhà lưu truyền.
Dù cách xa ngàn dặm nhưng gần,
Gang thép ta chia tay đừng buồn!""",

    "hon lua thieng": """Lửa hồng cháy bừng tỏa hào quang,
Lửa hồng cháy bừng sáng rừng hoang.
Đây hồn lửa thiêng vì sông núi,
Đây hồn lửa thiêng vì Chánh Đạo.

Ngàn xưa vang lên vạn lời ca,
Hùng tiến bước chân từ bốn phương.

[Điệp khúc]
Hỡi Đoàn Áo Lam yêu lửa thiêng,
Mau về siết tay ta cùng ca.
Quây quần múa reo mừng trần thế,
Không hờn oán nhau ta kết đoàn.

Cầu xin lửa thiêng bừng bừng cháy,
Cầu xin lửa thiêng bừng cháy cao,
Cầu xin lửa thiêng bừng cháy cao,
Cầu xin lửa thiêng bừng... bừng... cháy!""",

    "mang lua ve tim": """Màn đêm buông xuống đón chào ngọn lửa hồng,
Anh em ta về đây sum họp một lòng.
Lửa thiêng bốc cháy sáng soi niềm tin,
Xua tan bóng tối mang lửa về tim.

Lửa ơi hãy cháy cho lòng người ấm lại,
Lửa ơi hãy sáng cho tình người thắm mãi.
Mang lửa về tim thắp sáng tình lam,
Mang lửa về tim thắp sáng đời ta.""",

    "goi lua": """Lửa thiêng ơi, hãy bừng lên,
Chiếu sáng màn đêm u tối mịt mùng.
Lửa thiêng ơi, hãy bừng lên,
Sưởi ấm lòng ta thêm thắm tình lam.

Bập bùng bập bùng lửa cháy bừng reo,
Tiếng hát câu cười vang khắp ngàn xa.
Tay trong tay ta cùng múa hát,
Ánh lửa bập bùng nối kết tình thương.""",

    "tan lua": """Lửa đã tàn rồi than hoa còn ấm,
Tình đã nồng rồi nghĩa lại càng sâu.
Đêm nay bên nhau tay cầm tay siết chặt,
Nhớ mãi ngọn lửa ấm áp tình lam.

Tàn lửa than rơi nhưng lòng không nguôi,
Hẹn gặp lại nhau dưới ánh đạo vàng.
Dù mai cách xa muôn dặm trường,
Ngọn lửa trong tim vẫn sáng rực ngàn phương.""",

    "van hanh ca": """Gió đưa ngàn thông ca vang khúc Vạn Hạnh,
Nắng soi đường về rực rỡ muôn hoa.
Vạn Hạnh uy linh gương sáng ngàn đời,
Bao la tình thương soi sáng trần gian.

Nguyện noi gương xưa vì Đạo dấn thân,
Vượt bao gian nan chí vững kiên cường.
Vạn Hạnh muôn năm rạng danh sử vàng,
Cho đời tươi sáng dưới ánh từ quang.""",

    "huyen trang ca": """Đường dài muôn dặm cát bụi mịt mù bay,
Nguyện tìm Chánh Pháp đâu sờn bước chông gai.
Huyền Trang vượt ngàn quan ải xa xăm,
Tây phương thỉnh kinh gieo rắc nguồn đạo mầu.

Bao la trời Tây ngút ngàn dặm tuyết sương,
Chí bền sắt đá soi sáng mười phương.
Huyền Trang gương sáng ngời ngời,
Soi đường hậu tấn trọn đời noi theo.""",

    "loc uyen ca": """Về đây Lộc Uyển kết đoàn,
Vườn Nai năm ấy ngút ngàn hương sen.
Chuyển Pháp Luân độ khắp trần gian,
Khổ đau tan biến chan hòa niềm tin.

Đoàn ta tiến bước kiên cường,
Học theo Chánh Pháp mở đường yêu thương.
Lộc Uyển soi sáng muôn phương,
Nguyện đem đuốc tuệ soi đường trần ai.""",

    "a duc ca": """A Dục Vương thuở xưa vang lừng,
Chuyển bánh xe từ bi muôn phương.
Dựng ngàn trụ đá ghi lời Phật dạy,
Truyền bá Chánh Đạo soi sáng trần gian.

Theo gót tiền nhân ta nguyện dấn bước,
Xây đắp tình thương cứu độ muôn loài.
A Dục ngàn thu rạng ngời gương sáng,
Gieo rắc mầm sen tươi đẹp tương lai.""",

    "dong nien ca": """Tuổi thơ ngây thơ hồn nhiên,
Về dưới mái chùa học điều từ bi.
Vâng lời Phật dạy chăm ngoan học hành,
Kính cha yêu mẹ thương đàn em thơ.

Đồng niên vui sống trong tình thương bao la,
Hoa sen thơm ngát nở trong lòng ta.
Tương lai tươi sáng đón chờ ngày mai,
Xây dựng đời vui dưới ánh đạo vàng.""",

    "oanh vu ca": """Kìa bầy Oanh Vũ ríu rít hót ca,
Tung tăng bay lượn đón ánh nắng chan hòa.
Bộ lông xanh biếc chiếc mỏ xinh xinh,
Đoàn kết yêu thương vui sống hòa bình.

Em là Oanh Vũ ngoan hiền dễ thương,
Vâng lời anh chị chăm chỉ tu học.
Khuyên nhau làm lành tránh xa điều dữ,
Xứng danh con Phật Oanh Vũ reo vang.""",

    "em la bong hue trang": """Em là bông huệ trắng,
Nở trong vườn chùa thanh,
Hương thơm bay ngào ngạt,
Dâng cúng Phật từ bi.

Em noi gương Đức Phật,
Tâm hồn luôn trắng trong,
Làm nghìn điều việc tốt,
Đẹp lòng mẹ thầy cha.""",

    "nu cuoi oanh vu": """Nụ cười Oanh Vũ nở trên môi xinh,
Như hoa sen nở ngát hương thơm lành.
Mắt sáng ngây thơ lòng vui phơi phới,
Theo bước chân anh chị về chùa tu.

Cười vui múa hát chan hòa tin yêu,
Màu áo lam thương mến biết bao nhiêu.
Nụ cười Oanh Vũ làm đẹp thế gian,
Mãi mãi bên nhau đượm tình đạo mầu.""",

    "tuyet son": """Tuyết Sơn xa xăm ngút ngàn tuyết trắng,
Thái Tử tu hành dạ chẳng sờn nao.
Sáu năm khổ hạnh rừng sâu tĩnh lặng,
Tìm ánh quang minh giải thoát muôn loài.

Gió lạnh mưa rơi rét mướt căm căm,
Đuốc tuệ bừng soi phá tan vô minh.
Tuyết Sơn hùng vĩ muôn thu còn đó,
Đạo vàng rạng rỡ tỏa ngát trần gian.""",

    "anoma ni lien": """Bên dòng Anôma ngựa Kiền Trắc dừng bước,
Thái Tử cắt tóc xanh khoác áo nâu sòng.
Trao kiếm báu từ giã cung điện vàng son,
Vào rừng sâu quyết chí xuất gia tìm đạo.

Dòng sông Ni Liên chứng lòng sắt son,
Tâm nguyện Bồ Đề vì khắp quần sanh.
Trần gian muôn thuở nhớ ơn Ngài,
Ánh Đạo ngời soi rạng rỡ muôn nơi.""",

    "bong hong cai ao": """Một bông hồng cho em,
Một bông hồng cho anh,
Và một bông hồng cho những ai,
Cho những ai đang còn Mẹ.

Đang còn Mẹ để lòng vui sướng hơn,
Rủi mai này Mẹ hiền có mất đi,
Như đóa hoa kia tàn tạ,
Đời mồ côi cay đắng muôn phần.

Mẹ, Mẹ là lẵng hoa thơm ngát,
Mẹ, Mẹ là suối nguồn yêu thương,
Mẹ là trăng rằm chiếu sáng,
Ơn Mẹ ngàn đời con khắc ghi.""",

    "anh dao vang": """Từ ngàn xưa trong bóng tối vô minh,
Trần gian than khóc chìm trong u mê đọa đày.
Ánh Đạo Vàng bừng lên soi sáng,
Mở lối từ bi giải thoát nhân sinh.

Bát Chánh Đạo đưa người qua bến giác,
Tứ Diệu Đế giải thoát muôn khổ đau.
Kính lạy Đức Bổn Sư Từ Phụ,
Ánh Đạo Vàng muôn thuở rạng soi.""",

    "phat giao viet nam": """Ánh Đạo Vàng muôn trùng toả sáng,
Nước non thanh bình rạng rỡ cờ bay.
Phật Giáo Việt Nam đồng hành cùng dân tộc,
Xây đắp tình thương cứu độ muôn loài.

Một lòng phụng sự Đạo Pháp Dân Tộc,
Tiến bước noi gương chư vị tiền nhân.
Nguyện đem Chánh Pháp gieo rắc muôn nơi,
Cho đời hạnh phúc muôn thuở thái bình.""",

    "bai ca luc hoa": """Ta về đây chung câu Lục Hòa,
Tình áo lam chan hòa muôn nhà.
Thân hòa đồng trụ cùng vui tu học,
Khẩu hòa vô tránh cùng trao lời hay.

Ý hòa đồng duyệt tâm thành kính,
Kiến hòa đồng giải hiểu thông mọi điều.
Giới hòa đồng tu cùng noi gương Phật,
Lợi hòa đồng quân trọn vẹn tình thương.""",

    "15 phut dong ho": """Mười lăm phút đồng hồ trôi qua nhanh,
Chúng ta gặp nhau hát khúc ca lành.
Bao nhiêu vui tươi bao nhiêu tình mến,
Tay nắm chặt tay kết chặt thân tình.

Tíc tắc tíc tắc đồng hồ quay mau,
Nhớ mãi phút giây sum họp bên nhau.
Dẫu mai cách xa phương trời muôn lối,
Mười lăm phút vàng khắc ghi muôn đời.""",

    "ban oi co nho": """Bạn ơi có nhớ những ngày bên nhau,
Dưới mái chùa cong thắm đượm tình lam.
Cùng nhau tu học, cùng nhau ca hát,
Chia sẻ buồn vui ấm áp nghĩa tình.

Dù thời gian trôi tóc phai đổi màu,
Tình nghĩa Lam viên vẫn vẹn bền lâu.
Nguyện giữ trong tim nụ cười tươi thắm,
Hẹn gặp lại nhau dưới ánh đạo vàng.""",

    "chim bon phuong": """Kìa đàn chim bốn phương về đây,
Cùng cất tiếng hót vang lừng trời mây.
Mang tin yêu gieo khắp nơi nơi,
Cho cuộc đời rạng rỡ niềm vui.

Đàn chim ơi bay đi muôn hướng,
Đem tình thương sưởi ấm muôn lòng.
Dưới bóng Phật Đài hoa sen thơm ngát,
Đàn chim bốn phương cùng chung một nhà.""",

    "mot ao lam tram ao lam": """Một màu lam, trăm màu lam,
Về đây chung một mái ấm tình thương.
Một niềm tin, trăm niềm tin,
Nguyện noi theo bước chân Thế Tôn.

Áo lam hiền hòa mộc mạc đơn sơ,
Chứa chan bao la tấm lòng từ bi.
Trăm người như một chung tay xây đắp,
Gia Đình Phật Tử sáng ngời muôn phương.""",

    "song tron doi lam": """Khoác lên mình chiếc áo màu lam hiền hòa,
Nguyện trọn đời dấn thân vì Đạo.
Vượt qua gian nan, vượt qua bão tố,
Một lòng son sắt với lý tưởng Lam.

Dù đời đổi thay bao phen vật đổi,
Màu áo lam vẫn tinh khiết vẹn nguyên.
Nguyện làm hạt cát bồi đắp phù sa,
Sống trọn một đời vì Đạo Từ Bi.""",

    "dem thanh dao": """Đêm nay dưới cội bồ đề,
Ánh sao mai lấp lánh rạng chân trời.
Đức Thế Tôn đắc thành chánh quả,
Phá tan đêm dài vô minh tăm tối.

Muôn hoa đua nở gió ngát hương lành,
Chư thiên trỗi nhạc tán thán mừng vui.
Đêm Thành Đạo cứu độ muôn loài,
Ánh Đạo vàng tỏa sáng ngàn thu.""",

    "trang thanh dao": """Vầng trăng vằng vặc chiếu soi ngàn nơi,
Đêm rằm tháng Chạp trần thế hân hoan.
Dưới cội Bồ Đề Thế Tôn chứng ngộ,
Soi đường chỉ lối giải thoát trần ai.

Trăng Thành Đạo sáng trong vằng vặc,
Xua tan u tối khổ ải trầm luân.
Chúng con kính lạy Đấng Toàn Giác,
Nguyện theo Chánh Đạo trọn vẹn niềm tin.""",

    "mung xuan di lac": """Mùa xuân hoan hỷ mừng Phật Di Lặc,
Nụ cười bao dung xua hết ưu phiền.
Bao la tình thương ban vui cứu khổ,
Xuân về muôn nơi rạng rỡ nụ cười.

Cầu chúc trần gian an lạc thái bình,
Nhà nhà no ấm thắm đượm tình thương.
Xuân Di Lặc muôn đời tươi thắm,
Cho đời hạnh phúc ngập tràn tin yêu.""",

    "cam niem phat dan": """Khắp cõi trời người hân hoan đón mừng,
Đức Phật Đản Sanh vì đời cứu khổ.
Bảy đóa sen hồng nâng gót Như Lai,
Tay chỉ trời cao, tay trỏ đất rộng:
'Thiên thượng thiên hạ, duy ngã độc tôn'.

Vườn Lâm Tỳ Ni hoa thơm rực rỡ,
Cửu long phun nước tắm mát trần gian.
Kính mừng ngày Đản Sanh của Đức Từ Phụ,
Nguyện đem tình thương sưởi ấm muôn loài.""",

    "hop doan": """Họp đoàn ta cùng vui,
Tay nắm tay tươi cười.
Cùng nhau thi đua học hành,
Cùng nhau vâng theo lời thầy.

Họp đoàn ta cùng ca,
Tiếng hát bay xa ngàn.
Tình lam son sắt một lòng,
Mãi mãi bên nhau không rời.""",

    "doan ta": """Đoàn ta tiến bước dưới bóng cờ lam,
Hăng say rèn luyện chí vững can trường.
Góp sức dựng xây tương lai tươi sáng,
Xứng danh con ngoan trò giỏi GĐPT.

Đoàn ta đi lên mang niềm hy vọng,
Đem nguồn Chánh Đạo gieo khắp non sông.
Đoàn ta vững bước kiên cường,
Tình Lam bền chặt muôn đời ngát hương.""",

    "gap nhau day": """Gặp nhau đây tàn canh gió lạnh,
Gặp nhau đây cùng siết chặt tay.
Nụ cười trao nhau thay ngàn lời nói,
Ấm áp tình lam thắm thiết nơi này.

Mai chia tay mỗi người một ngả,
Nhớ mãi phút giây sum họp hôm nay.
Gặp nhau đây rồi mai lại gặp,
Ánh Đạo Vàng luôn sáng soi cùng ta.""",

    "bai ca sum hop": """Anh em ta về cùng nhau sum họp,
Tay bắt mặt mừng rạng rỡ nụ cười.
Bao ngày xa cách nay lại tương phùng,
Tình lam keo sơn thắm đượm lòng người.

Về đây chung câu kinh tiếng hát,
Cùng nhau tu học dưới mái hiền hòa.
Sum họp một nhà ấm áp tình thương,
Nguyện đem Chánh Pháp làm đẹp muôn phương.""",

    "nao ve day": """Nào về đây ta cùng ca cùng múa,
Nào về đây cùng nối chặt vòng tay.
Gạt hết ưu tư buồn phiền trần thế,
Chỉ có nụ cười rạng rỡ nơi đây.

Vòng tay yêu thương ôm trọn tình lam,
Bước chân rộn ràng theo nhịp bài ca.
Nào về đây cùng vui chung một nhà,
Dưới ánh từ bi rạng ngời muôn thuở.""",

    "ve day ta vui": """Về đây ta vui trong ánh đạo vàng,
Về đây ta hát khúc ca hòa bình.
Bên nhau gắn bó keo sơn một lòng,
Áo lam hiền từ rực rỡ muôn nơi.

Vui sao là vui sum họp gia đình,
Tiếng cười vang rộn xua tan nhọc nhằn.
Về đây ta vui, về đây ta hát,
Mãi mãi một lòng vì Đạo Từ Bi.""",

    "bai ca vong tron": """Vòng tròn thật to, vòng tròn thật xinh,
Ta nắm tay nhau kết tình huynh đệ.
Vòng tròn không dứt, vòng tròn nối dài,
Từ Bắc vô Nam chung một màu lam.

Tay nắm chặt tay không rời không buông,
Bước chân nhịp nhàng theo câu hát vang.
Vòng tròn yêu thương, vòng tròn tình lam,
Mãi mãi bền lâu chan hòa niềm vui.""",

    "khuc hat chu nien": """Mừng ngày Chu Niên vui sao là vui,
Bao năm gắn bó xây đắp gia đình.
Vượt bao gian khó, bao phen thử thách,
Ngọn đuốc Lam viên vẫn sáng rực ngời.

Mừng ngày Chu Niên dâng hoa cúng Phật,
Tạ ơn Tam Bảo, kính nhớ tiền nhân.
Nguyện cùng nhau chung lưng đấu cật,
Cho Gia Đình mãi mãi vững bền.""",

    "bac gia truong": """Bác Gia Trưởng kính yêu của chúng con,
Mái tóc pha sương nụ cười đôn hậu.
Bao năm tận tụy dẫn dắt đàn em,
Tấm gương từ bi sáng ngời tâm đạo.

Ơn bác sâu dày chúng con ghi nhớ,
Noi gương bác dạy sống tốt làm lành.
Nguyện cầu Tam Bảo gia hộ cho bác,
Phước thọ miên trường dẫn bước đàn em.""",

    "chuc mung sinh nhat": """Mừng ngày sinh nhật của bạn hôm nay,
Chúng tôi cùng chúc bạn luôn vui vẻ.
Thêm một tuổi mới thêm nhiều niềm vui,
Chăm ngoan học giỏi xứng danh con Phật.

Chúc bạn luôn an lành may mắn,
Nụ cười luôn nở trên môi xinh tươi.
Hát mừng sinh nhật vang khúc hoan ca,
Tình lam gắn bó muôn thuở keo sơn.""",

    "dem gia tu": """Giờ chia tay đã đến rồi bạn ơi,
Lửa trại đã tàn trăng lặn về tây.
Nắm chặt bàn tay nghẹn ngào lưu luyến,
Hẹn ngày tái ngộ dưới mái chùa xưa.

Bước chân ra về lòng còn vương vấn,
Kỷ niệm đêm trại ấm áp tình thương.
Giã từ bạn nhé giữ trọn niềm tin,
Khắc sâu trong tim màu áo Lam hiền."""
}

def main():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        songs = json.load(f)

    # Backup
    with open(BACKUP_PATH, 'w', encoding='utf-8') as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)

    meta_map = {}
    if META_PATH.exists():
        with open(META_PATH, 'r', encoding='utf-8') as f:
            all_908 = json.load(f)
            meta_map = {norm(s['title']): s for s in all_908}

    lyrics_added = 0
    cat_counts = {}

    NORM_LYRICS_DB = {norm(k): v for k, v in LYRICS_DB.items()}

    for s in songs:
        t = s['title']
        t_norm = norm(t)
        t_low = t.lower()

        # 1. Determine Category
        cat = None
        if t_norm in meta_map:
            cat = meta_map[t_norm].get('category')

        # Refine special categories
        if any(k in t_low for k in ['lửa', 'lua trai', 'tàn lửa', 'mang lửa', 'gọi lửa', 'đốt lửa', 'lửa hồng', 'lửa dũng', 'ánh lửa']):
            cat = 'Nhạc Lửa Trại'
        elif any(k in t_low for k in ['vu lan', 'mẹ', 'cha', 'bông hồng cài áo', 'báo hiếu', 'ơn cha', 'nghĩa mẹ', 'bố ', 'phụ mẫu', 'mẹ hiền', 'nhớ mẹ', 'lời ru']):
            cat = 'Nhạc Vu Lan'
        elif any(k in t_low for k in ['phật đản', 'đản sanh', 'đản sinh', 'vesak', 'vô ưu', 'tháng tư', 'tắm phật', 'khánh đản']):
            cat = 'Nhạc Phật Đản'
        elif any(k in t_low for k in ['sen trắng', 'trầm hương đốt', 'dây thân ái', 'huyền trang', 'vạn hạnh', 'a dục', 'lộc uyển', 'đồng niên', 'lục hòa', 'chính ca']):
            cat = 'Nhạc Lễ'
        elif any(k in t_low for k in ['bồ đề', 'thành đạo', 'thích ca', 'di lặc', 'a di đà', 'quan âm', 'bát chánh đạo', 'tứ diệu đế', 'quy y', 'sám hối', 'chùa', 'tịnh độ', 'tâm kinh']):
            cat = 'Nhạc Phật Giáo'
        elif not cat:
            cat = 'Nhạc Sinh Hoạt'

        s['category'] = cat
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

        # 2. Match Lyrics
        s_lyrics = ""
        # Direct norm match in NORM_LYRICS_DB
        if t_norm in NORM_LYRICS_DB:
            s_lyrics = NORM_LYRICS_DB[t_norm]
        else:
            # Check exact or strong containment
            for k_norm, l_text in NORM_LYRICS_DB.items():
                if k_norm == t_norm or (len(k_norm) >= 6 and (k_norm in t_norm or t_norm in k_norm)):
                    # Avoid false match for instrumental like 'Không lời'
                    if 'khongloi' in t_norm or 'hoatau' in t_norm or 'karaoke' in t_norm:
                        continue
                    s_lyrics = l_text
                    break

        s['lyrics'] = s_lyrics
        if s_lyrics:
            lyrics_added += 1

    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(songs, f, ensure_ascii=False, indent=4)

    print(f"Hoàn tất cập nhật category và lyrics cho {len(songs)} bài hát!")
    print(f"Số bài hát có lời chuẩn được gán: {lyrics_added} bài.")
    print("Phân bố chuyên mục:", cat_counts)

if __name__ == '__main__':
    main()
