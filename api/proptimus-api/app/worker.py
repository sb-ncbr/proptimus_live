import argparse


def main() -> None:
    parser = argparse.ArgumentParser(description="Run one PROPTIMUS optimisation job")
    parser.add_argument("job_id", help="PROPTIMUS job identifier")
    args = parser.parse_args()

    # Import after argument validation. routes contains the existing scientific
    # processing pipeline but does not start the Flask server when imported.
    from app.routes import optimise_structure

    optimise_structure(args.job_id, track_running=False)


if __name__ == "__main__":
    main()


