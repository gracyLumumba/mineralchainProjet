from utils.experiment_logger import rebuild_exports


def main():
    paths = rebuild_exports()
    for label, path in paths.items():
        print(f"{label}={path}")


if __name__ == "__main__":
    main()
