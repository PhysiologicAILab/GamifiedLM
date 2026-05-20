import { NextRequest, NextResponse } from 'next/server';

// Speech-to-Text API route using OpenAI API directly
// Requires OPENAI_API_KEY environment variable to be set

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Received audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Use OpenAI API directly with proper FormData handling
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile);
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
    }

    const transcript = await response.json();

    return NextResponse.json({
      text: transcript.text,
      language: transcript.language || 'unknown',
      durationInSeconds: transcript.duration || 0,
    });

  } catch (error) {
    console.error('STT Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
