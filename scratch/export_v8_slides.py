import os
import comtypes.client

def export_slides(pptx_path, output_dir):
    abs_pptx = os.path.abspath(pptx_path)
    abs_out = os.path.abspath(output_dir)
    os.makedirs(abs_out, exist_ok=True)
    
    powerpoint = comtypes.client.CreateObject("PowerPoint.Application")
    try:
        presentation = powerpoint.Presentations.Open(abs_pptx, WithWindow=False)
        presentation.SaveAs(abs_out, 17)  # ppSaveAsPNG
        presentation.Close()
        print("Export completed.")
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        powerpoint.Quit()

if __name__ == "__main__":
    export_slides(
        "docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v8.pptx",
        "docs/diagrams/lingora-modeling/deck/slides_v8_png"
    )
