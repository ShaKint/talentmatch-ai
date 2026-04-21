# אפיון מערכת המשקלים לניקוד מועמדים

## סקירה כללית
מערכת המשקלים היא מנגנון המאפשר למשרה להגדיר אילו קטגוריות טכניות וכישוריות חשובות ביותר, וכמה כל קטגוריה תורמת לניקוד סופי של המועמד.

---

## 1. מבנה הנתונים

### Job Entity - `parsed_data.weights`
```json
{
  "weights": {
    "leadership": 10,
    "primary_stack": 25,
    "secondary_stack": 15,
    "architecture": 20,
    "cloud_devops": 15,
    "custom_category": 15
  }
}
```

**תכונות:**
- **שם המשקל:** key (למשל "leadership") - ניתן להוסיף משקלים מותאמים אישית
- **ערך המשקל:** number (0-100) - משקל של הקטגוריה
- **סך הכל המשקלים:** צריך להסתכם ל-100 (או פחות אם יש משקלים אופציונליים)

---

## 2. חלוקת קטגוריות ברירת מחדל

| קטגוריה | משקל | תיאור |
|---------|------|-------|
| **leadership** | 10% | ניסיון הנהלה, מנהיגות, ניהול צוות |
| **primary_stack** | 25% | הטכנולוגיות ה"חזקות" של המשרה (React, Python וכו') |
| **secondary_stack** | 15% | טכנולוגיות תומכות (CI/CD, טול, Linters) |
| **architecture** | 20% | ניסיון בעיצוב מערכות, patterns, סקלביליות |
| **cloud_devops** | 15% | ענן (AWS, GCP, Azure), DevOps, קונטיינרים |
| **custom** | 15% | משקל חופשי - מותאם לכל משרה (Domain, Insurance וכו') |

---

## 3. תהליך היצירה של משקלים

### 3.1 פרסום משרה → `parseJobDescription(jobId)`

**קלט:** תיאור המשרה גולמי (raw_description) + הערות משהו (emphasis_notes)

**תהליך:**
1. LLM מנתח את תיאור המשרה
2. מחלץ את הדרישות הטכניות (skills, seniority, domain)
3. **יוצר משקלים בעל כוח** בהתאם לתוכן:
   - דגש על "leadership" → משקל גבוה (15-20)
   - דגש על "architecture" → משקל גבוה (25-30)
   - טכנולוגיה ספציפית חדשה → משקל custom

**פלט:** `parsed_data.weights` (עם משקלים שמסתכמים ל-100%)

### 3.2 עריכה ידנית של משקלים

**מקום:** `EditableParsedRequirements` component בעמוד `JobDetails`

**אפשריות:**
- שינוי ערך משקל (גרירה או הקלדה 0-100)
- הוספת קטגוריה חדשה
- הסרת קטגוריה

---

## 4. שימוש המשקלים בניקוד מועמד

### 4.1 תהליך הניתוח: `analyzeCandidate(jobId, candidateId)`

כשמועמד מופץ לניתוח:

1. **קריאת נתונים:**
   - משרה + משקליה
   - פרטי מועמד (profile, skills, experience)

2. **חישוב ניקוד לפי קטגוריה:**
   - לכל משקל בMust-Have דרישה → חישוב %match
   - למשל: אם "primary_stack" דורש React + Node.js
     - מועמד יש React + Node.js → 100%
     - מועמד יש React בלבד → 50%
     - מועמד אין → 0%

3. **יישום משקלים לחישוב סופי:**
   ```
   overall_score = 
     (leadership_match * weights.leadership) +
     (primary_stack_match * weights.primary_stack) +
     (secondary_stack_match * weights.secondary_stack) +
     (architecture_match * weights.architecture) +
     (cloud_devops_match * weights.cloud_devops)
   ```

4. **פלט:** `match_result`
   ```json
   {
     "overall_score": 78,
     "breakdown": {
       "core_match": 80,
       "primary_stack": 70,
       "secondary_stack": 90,
       "depth_match": 75,
       "cloud_devops": 60
     },
     "recommendation_level": "good_fit",
     "recommendation": "..."
   }
   ```

---

## 5. לוגיקה ההתאמה

### 5.1 רמות התאמה בהתאם לניקוד:

| ניקוד | רמה | הנחיה |
|------|-----|-------|
| 80-100% | **strong_fit** | מראשית - דפוק! |
| 60-79% | **good_fit** | טוב, ראוי לראיון |
| 40-59% | **partial_fit** | קצת חוסרים, בדוק פוטנציאל |
| 0-39% | **weak_fit** | לא התאמה |

### 5.2 השפעת Must-Have vs Nice-to-Have:

- **Must-Have:** אם מופיע במשקל ויש ניקוד נמוך (< 50%), המלצה עלולה להיות נמוכה יותר
- **Nice-to-Have:** בונוס לניקוד, אבל לא חובה

---

## 6. דוגמה מעשית

### דוגמה: משרת Senior React Developer

**משקלים שנוצרו:**
```json
{
  "leadership": 5,
  "primary_stack": 35,        // React, TypeScript, Node
  "secondary_stack": 15,       // Jest, Webpack, Git
  "architecture": 20,          // Design patterns, Scalability
  "cloud_devops": 15,          // AWS, Docker, CI/CD
  "backend_integration": 10    // REST APIs, GraphQL
}
```

**מועמד A:**
- React + TypeScript + Node.js ✓ (primary_stack: 100%)
- Jest, Git ✓ (secondary_stack: 80%)
- AWS + Docker ✓ (cloud_devops: 90%)
- Architecture patterns ✓ (architecture: 85%)
- ללא leadership (leadership: 0%)

**חישוב:**
```
Score = (100 × 0.35) + (80 × 0.15) + (90 × 0.15) + (85 × 0.20) + (0 × 0.05)
      = 35 + 12 + 13.5 + 17 + 0
      = 77.5% → "good_fit"
```

---

## 7. ממשק המשתמש

### EditableParsedRequirements Component

**פעולות אפשריות:**

1. **צפייה:** רשימת כל המשקלים הנוכחיים
2. **עריכה:** לחץ על סימן עיפרון → הקלד ערך חדש
3. **הוספה:** לחץ "הוסף קטגוריה" → הקלד שם → אישור
4. **הסרה:** לחץ X → מחיקה מיידית

**שמירה:** אוטומטית כל שינוי נשמר ל-DB

---

## 8. כללי עסקיים

✓ משקלים חייבים להסתכם ל-100%  
✓ אפשר לעדכן משקלים כל עוד התעודה לא "סגורה"  
✓ מועמדים שכבר נותחו **לא** מתעדכנים אם משקלים משתנים  
✓ משקל 0% = קטגוריה זו לא בדוקה בניקוד  

---

## 9. API Endpoints

**יצירת משקלים (בתוך parseJobDescription):**
- POST `/parseJobDescription`
- גם קובע את `Job.status = "active"`

**עדכון משקלים:**
- PUT `/jobs/{id}`
- JSON: `{ parsed_data: { weights: {...} } }`

**ניתוח מועמד (משתמש במשקלים):**
- POST `/analyzeCandidate`
- מחשב `match_result` בהתאם ל-weights של המשרה