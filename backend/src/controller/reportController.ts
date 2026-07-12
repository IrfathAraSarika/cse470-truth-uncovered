import { Request, Response } from 'express';
import { insertReport, ReportPayload } from 'backend/src/model/reportModel.ts';

export const submitReportController = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload: ReportPayload = req.body;

    // Validate Non-Nullable fields from your schema
    if (!payload.title || !payload.description || !payload.category || !payload.citizen_id || payload.is_anonymous === undefined) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: citizen_id, title, description, category, or is_anonymous.' 
      });
      return;
    }

    // Pass data to Model
    const newReport = await insertReport(payload);

    res.status(201).json({ 
      success: true, 
      message: 'Report submitted successfully!', 
      data: newReport 
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};