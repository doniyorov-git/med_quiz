#!/usr/bin/env python3
"""
Register customer group chats and bot metadata into /Users/mac/.hermes/profile.yaml
"""

import os
import sys
import uuid
import time
import yaml
from pathlib import Path

HERMES_DIR = Path("/Users/mac/.hermes")
PROFILE_YAML_PATH = HERMES_DIR / "profile.yaml"

CUSTOMER_PERSONAS = [
    {"id": "talaba_jasur", "title": "Jasur Bekmurodov (TMA)", "color": "#10b981", "shape": "circle"},
    {"id": "talaba_madina", "title": "Madina Karimova (ToshPTI)", "color": "#06b6d4", "shape": "hexagon"},
    {"id": "talaba_sherzod", "title": "Sherzod Olimov (SamDTU)", "color": "#f59e0b", "shape": "square"},
    {"id": "talaba_gulnoza", "title": "Gulnoza Yunusova (ADTI)", "color": "#ec4899", "shape": "circle"},
    {"id": "bobur_bitiruvchi", "title": "Bobur Mirzayev (BuxDTI)", "color": "#8b5cf6", "shape": "hexagon"},
    {"id": "dr_farrux", "title": "Dr. Farrux Rahimov", "color": "#ef4444", "shape": "circle"},
    {"id": "malika_kontrakt", "title": "Malika Ahmedova (TDSI)", "color": "#64748b", "shape": "square"},
    {"id": "akmal_repetitor", "title": "Akmal Ustoz (Repetitor)", "color": "#3b82f6", "shape": "hexagon"},
    {"id": "dotsent_nodira", "title": "Dotsent Nodira Shokirova", "color": "#0d9488", "shape": "circle"},
    {"id": "sardor_nostrifikatsiya", "title": "Sardor Qodirov (Nostrifikatsiya)", "color": "#d97706", "shape": "square"},
    {"id": "nargiza_toshpti", "title": "Nargiza Ergasheva (ToshPTI)", "color": "#14b8a6", "shape": "circle"},
    {"id": "dr_otabek_klinika", "title": "Dr. Otabek Jo'rayev (Klinika)", "color": "#1e3a8a", "shape": "hexagon"},
    {"id": "diyorbek_usmle", "title": "Diyorbek Sayfullayev (USMLE)", "color": "#6366f1", "shape": "square"},
    {"id": "shahlo_hamshira", "title": "Shahlo Zokirova (Texnikum)", "color": "#a855f7", "shape": "circle"},
    {"id": "bekzod_reanimatsiya", "title": "Bekzod Rustamov (Anesteziolog)", "color": "#dc2626", "shape": "hexagon"},
    {"id": "fotima_zuhra", "title": "Fotima & Zuhra (Egizaklar)", "color": "#f43f5e", "shape": "circle"},
    {"id": "mirjalol_bloger", "title": "Mirjalol Vohidov (Bloger)", "color": "#0284c7", "shape": "hexagon"},
    {"id": "dr_elyor_terapevt", "title": "Dr. Elyor Tursunov (Terapevt)", "color": "#047857", "shape": "square"},
    {"id": "kamron_toshpti", "title": "Kamron Ziyodov (ToshPTI)", "color": "#0891b2", "shape": "circle"},
    {"id": "prof_ilhom_dekan", "title": "Prof. Ilhom Mahmudov (Dekan)", "color": "#4338ca", "shape": "hexagon"}
]

def main():
    if not PROFILE_YAML_PATH.exists():
        print("profile.yaml not found!")
        return

    with open(PROFILE_YAML_PATH, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f) or {}

    if "ui_meta" not in data:
        data["ui_meta"] = {}

    if "hermes-bots-groups" not in data["ui_meta"]:
        data["ui_meta"]["hermes-bots-groups"] = {"version": 3, "rooms": {}}

    rooms = data["ui_meta"]["hermes-bots-groups"].get("rooms", {})

    GROUPS_CONFIG = [
        {
            "name": "MedQuiz Xaridorlar Guruhi",
            "roomId": "rm-medquiz-core",
            "members": ["talaba_jasur", "talaba_madina", "dr_farrux", "akmal_repetitor", "prof_ilhom_dekan"],
            "welcome": "Assalomu alaykum! MedQuiz loyihasining asosiy mijozlari shu guruhdamiz. Talaba, ordinator, repetitor va fakultet dekani loyiha va to'lovlar haqida savollaringizga javob berishga tayyormiz. Savolingizni bemalol bering!"
        },
        {
            "name": "MedQuiz Talabalar Guruhi",
            "roomId": "rm-medquiz-students",
            "members": ["talaba_jasur", "talaba_madina", "talaba_sherzod", "talaba_gulnoza", "kamron_toshpti"],
            "welcome": "Salom! Biz tibbiyot oliygohlari (TMA, ToshPTI, SamDTU, ADTI) talabalarimiz. Oraliq nazoratlar, HEMIS testlari, stipendiya va test yechish bo'yicha ehtiyojlarimizni so'rashingiz mumkin."
        },
        {
            "name": "MedQuiz Shifokorlar Guruhi",
            "roomId": "rm-medquiz-doctors",
            "members": ["dr_farrux", "bobur_bitiruvchi", "bekzod_reanimatsiya", "dr_elyor_terapevt", "sardor_nostrifikatsiya"],
            "welcome": "Salom hamkasblar! Bu guruhda amaliyotdagi vrachlar, ordinatorlar, magistratura va toifa attestatsiyasiga tayyorlanayotgan shifokorlar jamlangan. Biz uchun vaqt va klinik sifat eng muhim."
        },
        {
            "name": "MedQuiz B2B & Rahbarlar Guruhi",
            "roomId": "rm-medquiz-b2b",
            "members": ["prof_ilhom_dekan", "dr_otabek_klinika", "akmal_repetitor", "dotsent_nodira", "mirjalol_bloger"],
            "welcome": "Assalomu alaykum! Biz kafedra o'qituvchilari, dekan, klinika rahbari, repetitor va blogermiz. MedQuiz bilan korporativ shartnomalar, o'quvchilarni test qilish va marketing hamkorligi haqida so'rang."
        }
    ]

    now_ms = int(time.time() * 1000)

    for g in GROUPS_CONFIG:
        room_key = f"id:{g['roomId']}"
        member_records = []
        for m_id in g["members"]:
            member_records.append({
                "name": m_id,
                "handle": m_id,
                "connectionId": "local",
                "connectionKind": "local",
                "connectionLabel": "This device",
                "sourceScoped": True
            })

        rooms[room_key] = {
            "name": g["name"],
            "roomId": g["roomId"],
            "members": member_records,
            "revision": 1,
            "log": [
                {
                    "id": str(uuid.uuid4()),
                    "from": {
                        "kind": "member",
                        "name": g["members"][0]
                    },
                    "text": g["welcome"],
                    "at": now_ms,
                    "thread": f"th-{g['roomId']}"
                }
            ]
        }

    data["ui_meta"]["hermes-bots-groups"]["rooms"] = rooms
    data["ui_meta"]["hermes-bots-groups"]["updatedAt"] = now_ms

    if "hermes-bots" not in data["ui_meta"]:
        data["ui_meta"]["hermes-bots"] = {}

    for p in CUSTOMER_PERSONAS:
        data["ui_meta"]["hermes-bots"][p["id"]] = {
            "title": p["title"],
            "shape": p["shape"],
            "color": p["color"],
            "imageKind": "shape",
            "created": now_ms
        }

    with open(PROFILE_YAML_PATH, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False)

    print("Success! Registered all customer groups and bot metadatas into profile.yaml.")

if __name__ == "__main__":
    main()
