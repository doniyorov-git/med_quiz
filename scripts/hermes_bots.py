#!/usr/bin/env python3
"""
Hermes Customer Simulation & Willingness-to-Pay (WTP) Engine
MedQuiz loyihasi uchun 20 ta real mijoz botlari va bozor tahlili simulyatori.
"""

import json
from dataclasses import dataclass, asdict
from typing import List, Optional

@dataclass
class CustomerBot:
    id: int
    name: str
    age: int
    role: str
    institution: str
    city: str
    pain_point: str
    favorite_feature: str
    will_pay: str  # "Ha", "Shartli", "Yo'q"
    max_price_uzs_month: int
    pricing_model_preference: str
    objections: str
    demands_for_payment: str
    quote: str

BOTS: List[CustomerBot] = [
    CustomerBot(
        id=1,
        name="Jasur Bekmurodov",
        age=19,
        role="2-kurs talabasi (Davolash ishi)",
        institution="Toshkent Tibbiyot Akademiyasi (TMA)",
        city="Toshkent",
        pain_point="Normal anatomiya va gistologiyadan oraliq nazorat testlari juda ko'p, kitob va qog'ozda yodlash zerikarli.",
        favorite_feature="DOCX/PDF testlarni yuklash va do'stlar bilan Battle qilish",
        will_pay="Ha",
        max_price_uzs_month=30000,
        pricing_model_preference="Oylik obuna (25 000 - 30 000 so'm)",
        objections="Agar hamma narsa pullik bo'lib ketsa, guruhdoshlarim kirmay qo'yadi, battle qilishga odam qolmaydi.",
        demands_for_payment="Kafedramizning 1000 talik rasmiy test bazasi to'liq va xatosiz kiritilgan bo'lishi kerak.",
        quote="Bir piyola kofe puli ekan, agar oraliqdan yiqilmasdan stipendiya olsam, oyiga 30 ming so'm arziydi."
    ),
    CustomerBot(
        id=2,
        name="Madina Karimova",
        age=20,
        role="3-kurs talabasi (Pediatriya)",
        institution="Toshkent Pediatriya Tibbiyot Instituti (ToshPTI)",
        city="Toshkent",
        pain_point="Fiziologiya va farmakologiyadan xatolarimni qayta ko'rib chiqishga vaqt yetmaydi.",
        favorite_feature="Xatolar ustida ishlash bo'limi va Pufi AI izohlari",
        will_pay="Ha",
        max_price_uzs_month=40000,
        pricing_model_preference="Semestr / Oylik obuna",
        objections="Pufi AI beradigan tushuntirishlar tibbiy jihatdan qanchalik ishonchli? Noto'g'ri patogenez aytib chalg'itmasin.",
        demands_for_payment="Har bir noto'g'ri javobimga nima uchun xato ekanligini tibbiy darslik bo'yicha tushuntirib bersa to'layman.",
        quote="Menga shunchaki test emas, xatoyimni tushuntiradigan virtual ustoz kerak. Bunga 40 000 so'm berishga tayyorman."
    ),
    CustomerBot(
        id=3,
        name="Sherzod Olimov",
        age=22,
        role="4-kurs talabasi (Davolash)",
        institution="Samarqand Davlat Tibbiyot Universiteti (SamDTU)",
        city="Samarqand",
        pain_point="Testlarni yechganda qaysi javob to'g'ri ekanini bilaman, lekin klinik mantiqni tushunmayman.",
        favorite_feature="Jonli Battle va tezkor reyting",
        will_pay="Shartli",
        max_price_uzs_month=20000,
        pricing_model_preference="Bir martalik imtihon oldi to'lovi (15 000 - 20 000 so'm)",
        objections="Biz talabalarmiz, pulimiz kam. Telegramda bepul botlar ko'p, ulardan nima ustunligi bor?",
        demands_for_payment="Faqat sessiya paytida (1 oyga) arzon paket bo'lsa to'layman, butun yilga obuna bo'lmayman.",
        quote="Agar sessiya paytida hamma savollarning to'g'ri javobi aniq chiqsa, 20 ming so'm beraman, boshqa vaqt bepul ishlataman."
    ),
    CustomerBot(
        id=4,
        name="Gulnoza Yunusova",
        age=23,
        role="5-kurs talabasi (Davolash)",
        institution="Andijon Davlat Tibbiyot Instituti (ADTI)",
        city="Andijon",
        pain_point="Davlat attestatsiyasi va klinik fanlar testlari tarqoq, tartibsiz.",
        favorite_feature="To'plamlar (Banks) va PDF yuklash",
        will_pay="Ha",
        max_price_uzs_month=35000,
        pricing_model_preference="Oylik yoki 6 oylik obuna",
        objections="Viloyatda internet ba'zan sekinlashadi, oflayn rejim bormi?",
        demands_for_payment="PDF fayllarni yuklaganda rasmli testlarni ham to'g'ri taniy olsa va oflayn ishlasa.",
        quote="Klinik ordinaturaga kirishim kerak, menga har kuni 100 tadan test yechish tizimi kerak, 35 ming so'm muammo emas."
    ),
    CustomerBot(
        id=5,
        name="Bobur Mirzayev",
        age=24,
        role="6-kurs bitiruvchisi (Umumiy amaliyot shifokori)",
        institution="Buxoro Davlat Tibbiyot Instituti (BuxDTI)",
        city="Buxoro",
        pain_point="Klinik ordinatura va magistraturaga kirish imtihonlariga tayyorlanishda raqobat juda kuchli.",
        favorite_feature="Reyting, vaqtli imtihon simulyatori (Play rejimi)",
        will_pay="Ha",
        max_price_uzs_month=50000,
        pricing_model_preference="Yillik / Kurs paketi (150 000 - 200 000 so'm)",
        objections="Bazadagi savollar eski bo'lib qolmasligi kerak, 2026-yilgi yangi standartlar kiritilganmi?",
        demands_for_payment="DTM/Magistratura formati bilan 100% bir xil vaqt hisoblagichi va ball taqsimoti bo'lsa.",
        quote="Magistraturaga kontraktga kirgandan ko'ra bu platformaga 50 ming emas, 100 ming so'm to'lab tayyorlanganim ming marta afzal."
    ),
    CustomerBot(
        id=6,
        name="Dr. Farrux Rahimov",
        age=26,
        role="Klinik ordinator (Kardiologiya 1-yil)",
        institution="Respublika Kardiologiya Markazi",
        city="Toshkent",
        pain_point="Navbatchilikdan keyin kitob o'qishga quvvat yo'q, telefonda 10-15 daqiqa EKG va kardiologiya testlarini takrorlash zarur.",
        favorite_feature="Mobil qulay interfeys, xatolar tahlili",
        will_pay="Ha",
        max_price_uzs_month=60000,
        pricing_model_preference="Oylik avtomatik obuna",
        objections="Oddiy talabalar testlari menga to'g'ri kelmaydi, professional kardiologik klinik keyslar bormi?",
        demands_for_payment="Aynan kardiologiya va terapiya bo'yicha murakkab toifadagi testlar to'plami bo'lsa.",
        quote="Ishlaydigan shifokorman, oyligim bor. Agar vaqtimni tejasa, oyiga 60 000 so'm berishga tayyorman."
    ),
    CustomerBot(
        id=7,
        name="Malika Ahmedova",
        age=18,
        role="1-kurs kontrakt talabasi (Davolash)",
        institution="Toshkent Davlat Stomatologiya Instituti (TDSI)",
        city="Toshkent",
        pain_point="Kontrakt to'lovi o'zi qimmat, ota-onamdan ortiqcha ilova uchun pul so'rashga uyalaman.",
        favorite_feature="Bepul do'stlar bilan test yechish va asosiy baza",
        will_pay="Yo'q",
        max_price_uzs_month=0,
        pricing_model_preference="Faqat bepul (Freemium reklama bilan)",
        objections="Telegramda guruhlarda bepul testlar bor, nima uchun pul to'lashim kerak?",
        demands_for_payment="Do'stlarimni taklif qilsam (referal) menga bepul obuna berilsa ishlataman.",
        quote="Hozircha bir so'm ham to'lay olmayman. Lekin referal orqali do'stlarimni chaqirib tekinga Pro olsam, butun guruhimni olib kiraman."
    ),
    CustomerBot(
        id=8,
        name="Akmal Fayzullayev",
        age=29,
        role="Tibbiyot repetitori (Biologiya & Anatomiya o'qituvchisi)",
        institution="Xususiy 'MedStar' o'quv markazi",
        city="Toshkent",
        pain_point="30 nafar o'quvchimga test tarqatib, keyin ularning natijasini qo'lda tekshirish juda ko'p vaqt oladi.",
        favorite_feature="To'plam yaratish va guruh natijalarini ko'rish",
        will_pay="Ha",
        max_price_uzs_month=150000,
        pricing_model_preference="O'qituvchi / Repetitor tarifi (oyiga 100k - 200k)",
        objections="O'quvchilarim test javoblarini bir-biridan ko'chirib olmasligi uchun savollar ketma-ketligi random bo'ladimi?",
        demands_for_payment="O'z testlarimni yuklab, o'quvchilarim kim necha foiz ishlaganini ko'rsatadigan statistika paneli kerak.",
        quote="Bu mening oylik 20 soatlik vaqtimni tejaydi. 150 000 so'm men uchun 1 ta o'quvchining yarim oylik to'lovi, albatta to'layman."
    ),
    CustomerBot(
        id=9,
        name="Dotsent Nodira Shokirova",
        age=45,
        role="Kafedra o'qituvchisi / Dotsent",
        institution="TMA Patologik anatomiya kafedrasi",
        city="Toshkent",
        pain_point="Talabalar darsda telefon titadi, an'anaviy testlarni yoqtirmaydi, darsda interaktivlik yo'q.",
        favorite_feature="Jonli Battle rejimi (auditoriyada talabalarni musobaqa qildirish)",
        will_pay="Shartli",
        max_price_uzs_month=50000,
        pricing_model_preference="Universitet litsenziyasi yoki kafedra hisobidan",
        objections="Mening shaxsiy maoshimdan emas, universitet yoki institut grantidan to'lansa ma'qul.",
        demands_for_payment="Rasmiy protokol yoki natijalarni Excel formatida yuklab olish imkoniyati.",
        quote="Darsda 20 ta talabani bitta Battle xonasiga yig'ib musobaqa qildirish daho g'oya! Agar kafedra byudjetidan to'lansa, birinchi bo'lib qo'llayman."
    ),
    CustomerBot(
        id=10,
        name="Sardor Qodirov",
        age=25,
        role="Xorijiy diplom sohibi (Nostrifikatsiyaga tayyorgarlik)",
        institution="Qozog'iston Milliy Tibbiyot Universitetini bitirgan",
        city="Toshkent",
        pain_point="O'zbekistonda diplomni tasdiqlash (nostrifikatsiya) imtihonidan yiqilsam, 6 oy yo'qotaman.",
        favorite_feature="Barcha fanlardan umumiy qamrovli test banklari",
        will_pay="Ha",
        max_price_uzs_month=100000,
        pricing_model_preference="Bir martalik to'liq paket (200 000 - 300 000 so'm)",
        objections="Nostrifikatsiya imtihoniga tushadigan rasmiy savollar bilan 90%+ mos keladimi?",
        demands_for_payment="Davlat test markazi va Sog'liqni saqlash vazirligi bazasiga mos kelishi shart.",
        quote="Nostrifikatsiyadan o'tsam ishga kiraman. 100 000 so'm bu maqsad oldida hech narsa emas, faqat bazani to'liq bering."
    ),
    CustomerBot(
        id=11,
        name="Nargiza Ergasheva",
        age=21,
        role="4-kurs talabasi (Pediatriya)",
        institution="ToshPTI",
        city="Toshkent",
        pain_point="Test bazalari PDF formatida keladi, nusxa ko'chirib botlarga tiqish qiyin va vaqt oladi.",
        favorite_feature="PDF va DOCX fayllarni avtomatik testga aylantirish",
        will_pay="Ha",
        max_price_uzs_month=25000,
        pricing_model_preference="Oylik hamyonbop obuna",
        objections="Yuklagan PDF faylim ichidagi ba'zi savollar noto'g'ri o'qilsa, xatoni qo'lda to'g'rilash osonmi?",
        demands_for_payment="Institut bergan PDF ni shunchaki yuklasam, o'zi bir zumda test qilib bersa to'layman.",
        quote="PDF ni tashlasang tayyor testga aylantiradigan funksiyani ko'rib hayratda qoldim. Bunga oyiga 25 000 so'm bajonidil to'layman."
    ),
    CustomerBot(
        id=12,
        name="Dr. Otabek Jo'rayev",
        age=34,
        role="Xususiy klinika bosh shifokori / Asoschi",
        institution="'NiderMed' xususiy klinikasi",
        city="Farg'ona",
        pain_point="Ishga kelayotgan yosh shifokorlarning real bilimini tez va shaffof baholash imkoni yo'q.",
        favorite_feature="Klinik testlar banki va battle orqali sinov",
        will_pay="Ha",
        max_price_uzs_month=300000,
        pricing_model_preference="B2B Korporativ tarif (oyiga 300 000 - 500 000 so'm)",
        objections="Klinikamiz nomidan shaxsiy profil va maxfiy savollar bazasi ochish mumkinmi?",
        demands_for_payment="Ishga qabul qilish uchun nomzodlarga havola yuborib, ularning natijalarini shifrlangan holda olish.",
        quote="Biz oyiga 4-5 ta shifokorni suhbatdan o'tkazamiz. Agar MedQuiz shaffof imtihon tizimini bersa, oyiga 300 000 so'm arzon."
    ),
    CustomerBot(
        id=13,
        name="Diyorbek Sayfullayev",
        age=20,
        role="USMLE Step 1 talabgori (3-kurs talabasi)",
        institution="TMA Xalqaro fakulteti",
        city="Toshkent",
        pain_point="UWorld va Amboss juda qimmat (oyiga 300-400 dollar). O'zbekistonda arzonroq alternativ yo'q.",
        favorite_feature="Klinik keyslar, Pufi AI ning chuqur tibbiy javoblari",
        will_pay="Shartli",
        max_price_uzs_month=80000,
        pricing_model_preference="Premium xalqaro tarif",
        objections="Hozirgi savollar O'zbekiston standartida, menga inglizcha First Aid va USMLE formatidagi keyslar kerak.",
        demands_for_payment="Ingliz tili qo'shilsa va savollar patofiziologik klinik holatlar (case study) bo'lsa darhol to'layman.",
        quote="Agar USMLE uslubidagi savollarni O'zbekistonda 80 000 so'mga bersangiz, barcha ingliz guruhlari sizda o'qiydi."
    ),
    CustomerBot(
        id=14,
        name="Shahlo Zokirova",
        age=19,
        role="Hamshiralik ishi 2-kurs talabasi",
        institution="Abu Ali ibn Sino nomidagi Jamoat salomatligi texnikumi",
        city="Guliston",
        pain_point="Hamshiralar uchun maxsus testlar kam, darsliklar eski.",
        favorite_feature="Oddiy test yechish va darajalar (Talaba -> Shifokor)",
        will_pay="Yo'q",
        max_price_uzs_month=10000,
        pricing_model_preference="Faqat tekin yoki ramziy 10 000 so'm",
        objections="Kollej talabalarida daromad umuman yo'q.",
        demands_for_payment="Faqat bepul bo'lsa ishlataman yoki Click/Payme orqali 1 martalik 5 000 so'm bo'lsa balki.",
        quote="Texnikumda o'qiydiganlarning ko'pida pul yo'q, agar pullik qilib qo'ysangiz, guruhimizdan hech kim kirmaydi."
    ),
    CustomerBot(
        id=15,
        name="Bekzod Rustamov",
        age=27,
        role="Rezident-anesteziolog",
        institution="Respublika Shoshilinch Tibbiy Yordam Ilmiy Markazi (RShTYIM)",
        city="Toshkent",
        pain_point="Reanimatsiyada dori dozalari, shoshilinch algoritmlarni yodda saqlash hayotiy zarurat.",
        favorite_feature="Vaqtga qarshi tezkor test rejimi va Pufi AI",
        will_pay="Ha",
        max_price_uzs_month=50000,
        pricing_model_preference="Oylik obuna",
        objections="Savollar oddiy nazariya bo'lmasin, real reanimatsion favqulodda holatlar bo'yicha bo'lsin.",
        demands_for_payment="Shoshilinch yordam bo'yicha sifatli xalqaro protokollarga asoslangan testlar.",
        quote="Navbatchilikda bo'sh qolgan 15 daqiqada bilimni charxlab turish uchun 50 ming so'm juda arzon."
    ),
    CustomerBot(
        id=16,
        name="Fotima & Zuhra Aliyeva",
        age=20,
        role="2-kurs egizak talabalar",
        institution="SamDTU",
        city="Samarqand",
        pain_point="Ikkalamiz ham tibbiyotda o'qiymiz, xarajatlarimiz ikki barobar.",
        favorite_feature="Birgalikda Battle va xatolarni solishtirish",
        will_pay="Shartli",
        max_price_uzs_month=30000,
        pricing_model_preference="Oilaviy / Juftlik tarifi (2 ta akkaunt uchun 35 000)",
        objections="Bitta to'lov bilan 2 kishi yoki guruh bo'lib ishlatsa bo'ladimi?",
        demands_for_payment="Do'stlar paketi yoki guruh chegirmasi berilsa.",
        quote="Agar ikkalamiz uchun bitta arzon oilaviy tarif qilsangiz, oyiga 30-35 ming so'm to'laymiz."
    ),
    CustomerBot(
        id=17,
        name="Mirjalol Vohidov",
        age=22,
        role="Tibbiyot blogeri / Telegram kanal admini (18k obunachi)",
        institution="TMA 4-kurs talabasi",
        city="Toshkent",
        pain_point="Kanalimdagi obunachilarni faol ushlab turish uchun har kuni qiziqarli test va viktorina kerak.",
        favorite_feature="Battle xonalariga havola orqali ommaviy chaqirish",
        will_pay="Ha (Sheriklik/Hamkorlik)",
        max_price_uzs_month=0, # Partner model
        pricing_model_preference="Hamkorlik / Daromad ulushi (RevShare 20%)",
        objections="Mening auditoriyamni olib kirganim uchun menga qanday foyda bor?",
        demands_for_payment="Referal tizim: har bir obuna bo'lgan o'quvchim to'lovidan 20% keshbek berilsa, loyihani o'zim ommalashtiraman.",
        quote="Menda 18 mingta tibbiyot talabasi bor. Menga bepul Pro + referal keshbek bering, men sizga 1000 ta pullik mijoz olib kelaman."
    ),
    CustomerBot(
        id=18,
        name="Dr. Elyor Tursunov",
        age=38,
        role="Oliy toifali vrach-terapevt",
        institution="Toshkent shahar 1-son klinik shifoxonasi",
        city="Toshkent",
        pain_point="Har 5 yilda attestatsiyadan o'tib toifani tasdiqlash kerak. Qonun-qoidalar, klinik protokollar testlari qiyin.",
        favorite_feature="Klinik to'plamlar va tushuntirishlar",
        will_pay="Ha",
        max_price_uzs_month=70000,
        pricing_model_preference="Imtihon oldi 2 oylik paket (100 000 - 150 000 so'm)",
        objections="Attestatsiya savollari aynan SSV (Sog'liqni Saqlash Vazirligi) rasmiy komissiyasiga mos kelishi shart.",
        demands_for_payment="Toifa olishga oid yangi 2026-yilgi rasmiy test savollari jamlangan bo'lsa.",
        quote="Toifam oshsa oyligimga 30% qo'shiladi. Shu imtihondan o'tishim uchun 150 000 so'm bir martalik to'lov arzimas narsa."
    ),
    CustomerBot(
        id=19,
        name="Kamron Ziyodov",
        age=21,
        role="3-kurs talabasi (Toshkent Pediatriya)",
        institution="ToshPTI",
        city="Toshkent",
        pain_point="Boshqa fanlar bir amallab bo'ladi, lekin farmakologiya retseptlari va doza testlaridan hammamiz yiqilamiz.",
        favorite_feature="Pufi AI tahlili va Xatolar ustida mashq",
        will_pay="Ha",
        max_price_uzs_month=30000,
        pricing_model_preference="Oylik obuna",
        objections="To'lovni Click yoki Payme orqali 1 bosishda to'lash imkoni bo'lsin, kartani ulab qo'yishdan qo'rqaman.",
        demands_for_payment="Farmakologiyadan barcha guruh dorilari bo'yicha aniq xatolar tahlili.",
        quote="Faqat farmakologiyani yopib beradigan bo'lsa ham oyiga 30 ming so'm to'lashga roziman."
    ),
    CustomerBot(
        id=20,
        name="Prof. Ilhom Mahmudov",
        age=56,
        role="Fakultet dekani / Professor",
        institution="Toshkent Tibbiyot Akademiyasi",
        city="Toshkent",
        pain_point="HEMIS tizimidagi testlar zerikarli, talabalar ko'chirib oladi, shaffof nazorat yo'q.",
        favorite_feature="Anti-cheat, jonli vaqt nazorati, PDF bazalar",
        will_pay="Ha (Institut darajasida B2G/B2B)",
        max_price_uzs_month=1500000,
        pricing_model_preference="Institut/Kafedra yillik shartnomasi (yiliga 15-20 mln so'm)",
        objections="Tizim serverlari O'zbekistonda joylashganmi? Talabalar shaxsiy ma'lumotlari qonun bo'yicha himoyalanganmi?",
        demands_for_payment="HEMIS yoki universitet ichki tizimi bilan API integratsiyasi bo'lishi.",
        quote="Agar fakultetimizdagi 500 nafar talabaning oraliq nazoratini shaffof o'tkazib bersa, fakultet byudjetidan shartnoma qilamiz."
    )
]

def analyze_bots():
    total = len(BOTS)
    will_pay_yes = sum(1 for b in BOTS if b.will_pay == "Ha" or "Ha" in b.will_pay)
    will_pay_cond = sum(1 for b in BOTS if b.will_pay == "Shartli")
    will_pay_no = sum(1 for b in BOTS if b.will_pay == "Yo'q")

    # Calculate average WTP among those willing to pay (excluding institutional outliers for B2C calculation)
    b2c_payers = [b.max_price_uzs_month for b in BOTS if b.will_pay in ["Ha", "Shartli"] and b.max_price_uzs_month <= 150000 and b.max_price_uzs_month > 0]
    avg_b2c_wtp = sum(b2c_payers) / len(b2c_payers) if b2c_payers else 0

    print("=== HERMES 20 BOT TAHLIL NATIJALARI ===")
    print(f"Jami botlar soni: {total}")
    print(f"Aniq to'lashga tayyor ('Ha'): {will_pay_yes} ({will_pay_yes/total*100:.1f}%)")
    print(f"Shartli to'lashga tayyor ('Shartli'): {will_pay_cond} ({will_pay_cond/total*100:.1f}%)")
    print(f"To'lashni istamaydi ('Yo'q'): {will_pay_no} ({will_pay_no/total*100:.1f}%)")
    print(f"O'rtacha B2C to'lov tayyorgarligi: {avg_b2c_wtp:,.0f} so'm/oy")
    
    return {
        "total": total,
        "will_pay_yes": will_pay_yes,
        "will_pay_cond": will_pay_cond,
        "will_pay_no": will_pay_no,
        "avg_b2c_wtp": avg_b2c_wtp
    }

if __name__ == "__main__":
    analyze_bots()
