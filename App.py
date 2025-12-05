import json
from typing import Dict, Any, List, Optional

import streamlit as st

# OPTIONAL: if you want to actually call Gemini from Python
# Make sure you: pip install google-generativeai
# and put your key in .streamlit/secrets.toml as GEMINI_API_KEY="<your_key>"
try:
    import google.generativeai as genai
    GEMINI_ENABLED = True
    genai.configure(api_key=st.secrets.get("GEMINI_API_KEY", ""))
except Exception:
    GEMINI_ENABLED = False


# ------------------ CONFIG ------------------ #

OCCASION_MIN_LENGTH = 5
OCCASION_MAX_LENGTH = 300
PREFERENCES_MAX_LENGTH = 200

SUGGESTED_OCCASIONS = [
    "Casual Coffee Date",
    "Summer Wedding Guest",
    "Tech Job Interview",
    "Weekend Brunch",
    "Gallery Opening",
    "Beach Vacation",
]

GENDER_OPTIONS = ["Female", "Male", "Non-Binary"]


# ------------------ GEMINI BACKEND ------------------ #

def get_outfit_recommendation(
    occasion: str,
    gender: str,
    preferences: str,
) -> Dict[str, Any]:
    """
    Call Gemini (or your own backend) and return a dict like:
    {
      "primary_outfit": {...},
      "additional_suggestions": [...],
      "styling_notes": "..."
    }
    """

    if not GEMINI_ENABLED:
        # Fallback: dummy data so the UI still works
        return {
            "primary_outfit": {
                "title": "Chic Minimal Look",
                "top": "White oversized cotton shirt with relaxed sleeves.",
                "bottom": "High-waisted straight-leg light blue jeans.",
                "footwear": "Clean white sneakers.",
                "accessories": [
                    "Small structured beige shoulder bag",
                    "Thin silver hoop earrings",
                ],
                "reasoning": "Comfortable yet polished, matches a wide range of casual–smart occasions.",
            },
            "additional_suggestions": [
                {
                    "label": "Casual Alternative",
                    "outfit_summary": "Soft pastel tee, loose mom jeans, and canvas sneakers.",
                },
                {
                    "label": "Trendier Option",
                    "outfit_summary": "Cropped blazer, wide-leg trousers, chunky sneakers, and a mini shoulder bag.",
                },
                {
                    "label": "Budget-Friendly Choice",
                    "outfit_summary": "Basic solid tee, black jeans, and simple slip-on sneakers.",
                },
            ],
            "styling_notes": "Keep makeup soft, hair natural, and add a subtle fragrance to complete the look.",
        }

    prompt = f"""
You are an AI stylist. Follow the system rules already given to you.

User query for outfit recommendation:
- Occasion / event: "{occasion}"
- Style focus (gender): {gender}
- Extra notes / preferences: {preferences or "None"}

Return ONLY a valid JSON matching this structure:
{{
  "primary_outfit": {{
    "title": "string",
    "top": "string",
    "bottom": "string",
    "footwear": "string",
    "accessories": ["string"],
    "reasoning": "string"
  }},
  "additional_suggestions": [
    {{
      "label": "string",
      "outfit_summary": "string"
    }}
  ],
  "styling_notes": "string"
}}
"""

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    # Gemini usually returns text; try to parse JSON from it
    text = response.text.strip()
    # Try to extract JSON if there's extra wrapping text
    try:
        # If it's already pure JSON
        data = json.loads(text)
        return data
    except json.JSONDecodeError:
        # Try to find JSON block between ``` or similar
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            json_str = text[start : end + 1]
            return json.loads(json_str)
        raise ValueError("Could not parse JSON from model response.")


# ------------------ VALIDATION HELPERS ------------------ #

def validate_occasion(occasion: str) -> str:
    trimmed = occasion.strip()
    if not trimmed:
        return "Please describe the occasion."
    if len(trimmed) < OCCASION_MIN_LENGTH:
        return f"Add at least {OCCASION_MIN_LENGTH} characters."
    if len(occasion) > OCCASION_MAX_LENGTH:
        return f"Limit to {OCCASION_MAX_LENGTH} characters."
    if not any(c.isalpha() for c in trimmed):
        return "Please include descriptive text."
    return ""


def validate_gender(gender: str) -> str:
    if not gender.strip():
        return "Please select a style focus."
    return ""


def validate_preferences(prefs: str) -> str:
    if len(prefs) > PREFERENCES_MAX_LENGTH:
        return f"Limit to {PREFERENCES_MAX_LENGTH} characters."
    if prefs and not any(c.isalnum() for c in prefs):
        return "Please include valid text."
    return ""


# ------------------ OUTFIT DISPLAY ------------------ #

def display_outfit(data: Dict[str, Any]) -> None:
    primary = data.get("primary_outfit", {}) or {}
    suggestions: List[Dict[str, Any]] = data.get("additional_suggestions", []) or []
    styling_notes: str = data.get("styling_notes", "")

    st.markdown("### ✨ Your Curated Look")
    with st.container():
        st.markdown(
            """
            <div class="card primary-card">
            """,
            unsafe_allow_html=True,
        )

        st.markdown(
            f"""
            <div class="pill-label">Primary Outfit</div>
            <h2 class="primary-title">{primary.get("title", "Outfit")}</h2>
            """,
            unsafe_allow_html=True,
        )

        cols = st.columns(2)
        with cols[0]:
            st.markdown("**Top**")
            st.write(primary.get("top", "—"))
            st.markdown("**Bottom**")
            st.write(primary.get("bottom", "—"))
        with cols[1]:
            st.markdown("**Footwear**")
            st.write(primary.get("footwear", "—"))
            st.markdown("**Accessories**")
            accessories = primary.get("accessories") or []
            if isinstance(accessories, list) and accessories:
                st.write(", ".join(accessories))
            else:
                st.write("—")

        st.markdown("**Why this works**")
        st.write(primary.get("reasoning", ""))

        st.markdown("</div>", unsafe_allow_html=True)

    if suggestions:
        st.markdown("### 🌈 More Ways to Wear It")
        cols = st.columns(len(suggestions))
        for col, sug in zip(cols, suggestions):
            with col:
                st.markdown(
                    f"""
                    <div class="card alt-card">
                        <div class="alt-label">{sug.get("label", "")}</div>
                        <p>{sug.get("outfit_summary", "")}</p>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    if styling_notes:
        st.markdown("### 📝 Styling Notes")
        st.markdown(
            f"""
            <div class="card notes-card">
                {styling_notes}
            </div>
            """,
            unsafe_allow_html=True,
        )


# ------------------ MAIN APP ------------------ #

def main():
    st.set_page_config(
        page_title="FashionMate – AI Stylist",
        page_icon="👗",
        layout="centered",
    )

    # ----- Custom CSS for colorful yet decent aesthetic ----- #
    st.markdown(
        """
        <style>
        /* Background blobs */
        .stApp {
            background: radial-gradient(circle at 0% 0%, #f9e8ff 0, transparent 55%),
                        radial-gradient(circle at 100% 0%, #ffe5e5 0, transparent 55%),
                        radial-gradient(circle at 50% 100%, #fff5da 0, transparent 55%),
                        #faf7f4;
            color: #2b2119;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
        }
        .main {
            padding-top: 2rem;
        }
        /* Cards */
        .card {
            border-radius: 1.75rem;
            padding: 1.7rem 1.8rem;
            background: rgba(255, 255, 255, 0.86);
            border: 1px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
            backdrop-filter: blur(16px);
        }
        .primary-card {
            border: 1px solid rgba(15, 23, 42, 0.08);
        }
        .alt-card {
            font-size: 0.9rem;
            line-height: 1.4;
        }
        .notes-card {
            font-size: 0.95rem;
            border-style: dashed;
            border-color: rgba(148, 163, 184, 0.6);
        }
        .pill-label {
            display: inline-flex;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            padding: 0.35rem 0.8rem;
            border-radius: 999px;
            background: rgba(248, 250, 252, 0.9);
            border: 1px solid rgba(226, 232, 240, 0.9);
            color: #64748b;
            margin-bottom: 0.75rem;
        }
        .primary-title {
            font-family: "Times New Roman", "Georgia", ui-serif;
            font-size: 1.7rem;
            margin-bottom: 1.2rem;
        }
        .alt-label {
            font-weight: 600;
            font-size: 0.85rem;
            margin-bottom: 0.35rem;
            color: #334155;
        }

        /* Header title */
        .hero-title {
            font-family: "Times New Roman", "Georgia", ui-serif;
            font-size: clamp(2.2rem, 5vw, 3.5rem);
            line-height: 1.08;
        }
        .hero-gradient {
            background: linear-gradient(90deg, #111827, #6b7280, #111827);
            -webkit-background-clip: text;
            color: transparent;
        }

        /* Small helper text */
        .helper-text {
            font-size: 0.75rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
        }

        textarea, input {
            font-family: inherit;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    # ----- Session state init ----- #
    if "occasion" not in st.session_state:
        st.session_state.occasion = ""
    if "gender" not in st.session_state:
        st.session_state.gender = ""
    if "preferences" not in st.session_state:
        st.session_state.preferences = ""
    if "result" not in st.session_state:
        st.session_state.result = None
    if "error" not in st.session_state:
        st.session_state.error = ""
    if "touched" not in st.session_state:
        st.session_state.touched = {"occasion": False, "gender": False, "preferences": False}

    # ----- Header ----- #
    top_bar = st.container()
    with top_bar:
        cols = st.columns([1, 1])
        with cols[0]:
            if st.session_state.result:
                if st.button("🔁 New Search"):
                    st.session_state.occasion = ""
                    st.session_state.gender = ""
                    st.session_state.preferences = ""
                    st.session_state.result = None
                    st.session_state.error = ""
                    st.session_state.touched = {
                        "occasion": False,
                        "gender": False,
                        "preferences": False,
                    }
        with cols[1]:
            st.markdown(
                "<div style='text-align: right; font-weight: 600;'>FashionMate · AI Stylist 👗</div>",
                unsafe_allow_html=True,
            )

    st.markdown("---")

    # ----- Main content ----- #
    if not st.session_state.result:
        st.markdown(
            """
            <div style="text-align:center; margin-bottom: 2rem;">
                <div class="helper-text" style="color:#6b7280;">AI Personal Stylist</div>
                <h1 class="hero-title">
                    What is the<br/>
                    <span class="hero-gradient"><em>occasion?</em></span>
                </h1>
            </div>
            """,
            unsafe_allow_html=True,
        )

        with st.form("outfit_form"):
            # Occasion
            occ_col1, occ_col2 = st.columns([3, 1])
            with occ_col1:
                st.markdown(
                    "<span class='helper-text' style='color:#9ca3af;'>Describe the Event</span>",
                    unsafe_allow_html=True,
                )
            with occ_col2:
                st.markdown(
                    f"<div style='text-align:right; font-size:0.7rem; color:#9ca3af;'>{len(st.session_state.occasion)}/{OCCASION_MAX_LENGTH}</div>",
                    unsafe_allow_html=True,
                )

            st.session_state.occasion = st.text_area(
                "",
                value=st.session_state.occasion,
                placeholder="e.g. A gallery opening in the city, minimal but chic...",
                height=100,
            )
            st.session_state.touched["occasion"] = True
            occ_error = validate_occasion(st.session_state.occasion)
            if occ_error:
                st.markdown(f"<span style='color:#f97373; font-size:0.8rem;'>{occ_error}</span>", unsafe_allow_html=True)

            st.write("")

            # Gender / style focus
            st.markdown(
                "<span class='helper-text' style='color:#9ca3af;'>Style Focus</span>",
                unsafe_allow_html=True,
            )
            st.session_state.gender = st.radio(
                "",
                options=GENDER_OPTIONS,
                horizontal=True,
                index=GENDER_OPTIONS.index(st.session_state.gender)
                if st.session_state.gender in GENDER_OPTIONS
                else 0,
            )
            st.session_state.touched["gender"] = True
            gender_error = validate_gender(st.session_state.gender)
            if gender_error:
                st.markdown(f"<span style='color:#f97373; font-size:0.8rem;'>{gender_error}</span>", unsafe_allow_html=True)

            st.write("")

            # Preferences
            pref_col1, pref_col2 = st.columns([3, 1])
            with pref_col1:
                st.markdown(
                    "<span class='helper-text' style='color:#9ca3af;'>Any Preferences? (Optional)</span>",
                    unsafe_allow_html=True,
                )
            with pref_col2:
                st.markdown(
                    f"<div style='text-align:right; font-size:0.7rem; color:#9ca3af;'>{len(st.session_state.preferences)}/{PREFERENCES_MAX_LENGTH}</div>",
                    unsafe_allow_html=True,
                )

            st.session_state.preferences = st.text_input(
                "",
                value=st.session_state.preferences,
                placeholder="e.g. No heels, love pastels...",
            )
            st.session_state.touched["preferences"] = True
            pref_error = validate_preferences(st.session_state.preferences)
            if pref_error:
                st.markdown(f"<span style='color:#f97373; font-size:0.8rem;'>{pref_error}</span>", unsafe_allow_html=True)

            # Submit
            is_form_valid = not occ_error and not gender_error and not pref_error

            submit = st.form_submit_button(
                "✨ Curate My Look",
                disabled=not is_form_valid,
            )

        # Suggested occasions chips
        st.write("")
        st.markdown("###### Try a quick suggestion")
        chip_cols = st.columns(3)
        for i, text in enumerate(SUGGESTED_OCCASIONS):
            with chip_cols[i % 3]:
                if st.button(text, key=f"sugg_{i}"):
                    st.session_state.occasion = text

        if submit and is_form_valid:
            st.session_state.error = ""
            with st.spinner("Curating your look..."):
                try:
                    data = get_outfit_recommendation(
                        st.session_state.occasion,
                        st.session_state.gender,
                        st.session_state.preferences,
                    )
                    st.session_state.result = data
                except Exception as e:
                    st.session_state.error = str(e)

    # Error
    if st.session_state.error and not st.session_state.result:
        st.error(f"Style error: {st.session_state.error}")

    # Result
    if st.session_state.result:
        display_outfit(st.session_state.result)


if __name__ == "__main__":
    main()