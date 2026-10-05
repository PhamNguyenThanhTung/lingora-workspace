import os
import sys
import comtypes.client

def export_slides(pptx_path, output_dir):
    abs_pptx = os.path.abspath(pptx_path)
    abs_out = os.path.abspath(output_dir)
    os.makedirs(abs_out, exist_ok=True)
    
    print(f"Exporting: {abs_pptx}")
    print(f"Destination: {abs_out}")
    
    powerpoint = comtypes.client.CreateObject("PowerPoint.Application")
    # powerpoint.Visible = 1
    try:
        presentation = powerpoint.Presentations.Open(abs_pptx, WithWindow=False)
        # Export as PNG
        # ppSaveAsPNG = 17
        presentation.SaveAs(abs_out, 17)
        presentation.Close()
        print("Export completed.")
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        powerpoint.Quit()

if __name__ == "__main__":
    pptx = "docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v7.pptx"
    out = "docs/diagrams/lingora-modeling/deck/slides_v7_png"
    export_slides(pptx, out)
