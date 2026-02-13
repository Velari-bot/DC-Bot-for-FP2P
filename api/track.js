const admin = require('./utils/firebaseAdmin');
const db = admin.firestore();

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { action, videoId, courseId, lessonId, title } = req.body;

    if (action === 'video_view') {
        if (!videoId && !lessonId) return res.status(400).json({ error: 'Missing videoId or lessonId' });

        try {
            const id = lessonId || videoId;
            const viewRef = db.collection('video_analytics').doc(id);
            const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM

            await db.runTransaction(async (t) => {
                const doc = await t.get(viewRef);
                const data = doc.exists ? doc.data() : { totalViews: 0, monthlyViews: {}, title: title || 'Unknown Video' };

                const totalViews = (data.totalViews || 0) + 1;
                const monthlyViews = data.monthlyViews || {};
                monthlyViews[monthKey] = (monthlyViews[monthKey] || 0) + 1;

                t.set(viewRef, {
                    totalViews,
                    monthlyViews,
                    title: title || data.title,
                    lastViewed: admin.firestore.FieldValue.serverTimestamp(),
                    courseId: courseId || data.courseId || null
                }, { merge: true });

                // Also log a daily generic count for "total views per month" across all videos
                const globalRef = db.collection('site_analytics').doc('video_stats');
                const globalDoc = await t.get(globalRef);
                const globalData = globalDoc.exists ? globalDoc.data() : { monthlyTotal: {} };
                const globalMonthlyTotal = globalData.monthlyTotal || {};
                globalMonthlyTotal[monthKey] = (globalMonthlyTotal[monthKey] || 0) + 1;
                t.set(globalRef, { monthlyTotal: globalMonthlyTotal }, { merge: true });
            });

            return res.status(200).json({ success: true });
        } catch (e) {
            console.error("Tracking Error:", e);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(400).json({ error: 'Invalid action' });
};
